/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: exercise_tracker.c
 * Description: Biomechanical State Machine & Angle-Driven Rep Counter Implementation
 * ============================================================================
 */

#include "exercise_tracker.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

static void configure_thresholds(ExerciseTracker* tracker, ExerciseType type) {
    switch (type) {
        case EXERCISE_BICEP_CURL:
            strncpy(tracker->name, "Bicep Curl", sizeof(tracker->name) - 1);
            tracker->config.extension_threshold_deg = 150.0;
            tracker->config.contraction_threshold_deg = 55.0;
            tracker->config.min_rep_duration_sec = 0.75;
            tracker->config.max_rep_duration_sec = 8.0;
            tracker->config.acceptable_rom_margin_deg = 15.0;
            break;

        case EXERCISE_SQUAT:
            strncpy(tracker->name, "Squat", sizeof(tracker->name) - 1);
            tracker->config.extension_threshold_deg = 165.0;
            tracker->config.contraction_threshold_deg = 90.0;
            tracker->config.min_rep_duration_sec = 1.0;
            tracker->config.max_rep_duration_sec = 10.0;
            tracker->config.acceptable_rom_margin_deg = 12.0;
            break;

        case EXERCISE_SHOULDER_PRESS:
            strncpy(tracker->name, "Shoulder Press", sizeof(tracker->name) - 1);
            tracker->config.extension_threshold_deg = 70.0;  /* Elbow bent at bottom */
            tracker->config.contraction_threshold_deg = 155.0; /* Full overhead press */
            tracker->config.min_rep_duration_sec = 0.8;
            tracker->config.max_rep_duration_sec = 8.0;
            tracker->config.acceptable_rom_margin_deg = 15.0;
            break;

        case EXERCISE_PUSHUP:
            strncpy(tracker->name, "Push-up", sizeof(tracker->name) - 1);
            tracker->config.extension_threshold_deg = 160.0; /* Plank up */
            tracker->config.contraction_threshold_deg = 80.0;  /* Chest to floor */
            tracker->config.min_rep_duration_sec = 0.8;
            tracker->config.max_rep_duration_sec = 9.0;
            tracker->config.acceptable_rom_margin_deg = 15.0;
            break;
    }
}

ExerciseTracker* tracker_create(ExerciseType type, int target_reps, AlertQueue* alert_q, RepHistoryList* history) {
    ExerciseTracker* t = (ExerciseTracker*)malloc(sizeof(ExerciseTracker));
    if (!t) return NULL;

    memset(t, 0, sizeof(ExerciseTracker));
    t->type = type;
    t->target_reps = (target_reps > 0) ? target_reps : 12;
    t->planned_target_reps = t->target_reps;
    t->current_phase = REP_PHASE_START;
    t->alert_queue = alert_q;
    t->history = history;

    angle_smoother_init(&t->smoother, 0.45);
    configure_thresholds(t, type);

    /* Initial fatigue state: optimal */
    t->fatigue_telemetry.mental_fatigue_pct = 15.0;
    t->fatigue_telemetry.perceived_exertion_rpe = 2.0;
    t->fatigue_telemetry.form_degradation_pct = 5.0;
    t->fatigue_telemetry.cadence_slowdown_ratio = 1.0;
    t->fatigue_telemetry.tremor_instability_score = 4.0;

    fatigue_evaluate_and_adjust(&t->fatigue_telemetry, t->target_reps, 0, &t->fatigue_scaling);
    return t;
}

void tracker_destroy(ExerciseTracker* tracker) {
    if (tracker) {
        free(tracker);
    }
}

void tracker_set_exercise(ExerciseTracker* tracker, ExerciseType type) {
    if (!tracker) return;
    tracker->type = type;
    tracker->current_phase = REP_PHASE_START;
    tracker->completed_reps = 0;
    tracker->target_reps = tracker->planned_target_reps;
    configure_thresholds(tracker, type);
    angle_smoother_init(&tracker->smoother, 0.45);
}

void tracker_update_fatigue(ExerciseTracker* tracker, const FatigueInputTelemetry* telemetry) {
    if (!tracker || !telemetry) return;
    tracker->fatigue_telemetry = *telemetry;

    int old_target = tracker->target_reps;
    fatigue_evaluate_and_adjust(&tracker->fatigue_telemetry,
                                tracker->planned_target_reps,
                                tracker->completed_reps,
                                &tracker->fatigue_scaling);

    tracker->target_reps = tracker->fatigue_scaling.adjusted_target_reps;

    if (tracker->fatigue_scaling.requires_intervention && tracker->target_reps < old_target) {
        if (tracker->alert_queue) {
            alert_queue_push(tracker->alert_queue, ALERT_CRITICAL, CAT_FATIGUE_OVERLOAD,
                             tracker->fatigue_scaling.composite_fatigue_pct,
                             "FATIGUE OVERLOAD: Mental fatigue critical! Target reduced from %d to %d reps.",
                             old_target, tracker->target_reps);
        }
    }
}

bool tracker_process_landmarks(ExerciseTracker* tracker,
                               Point2D joint_a,
                               Point2D joint_b,
                               Point2D joint_c,
                               double current_time_sec) {
    if (!tracker) return false;

    /* Compute raw Euclidean angle at vertex B */
    double raw = calculate_joint_angle_deg(joint_a, joint_b, joint_c);
    tracker->raw_angle_deg = raw;

    /* Filter angle using exponential moving average */
    double angle = angle_smoother_update(&tracker->smoother, raw);
    tracker->smoothed_angle_deg = angle;

    /* Calculate angular velocity */
    double dt = current_time_sec - tracker->last_frame_time_sec;
    if (dt > 1e-4 && tracker->last_frame_time_sec > 0.0) {
        tracker->live_velocity_deg_per_sec = fabs(angle - tracker->smoother.filtered_angle) / dt;
    }
    tracker->last_frame_time_sec = current_time_sec;

    bool rep_registered = false;
    double ext_thresh = tracker->config.extension_threshold_deg;
    double cont_thresh = tracker->config.contraction_threshold_deg;
    bool is_inversion = (cont_thresh > ext_thresh); /* e.g. Overhead press starts low, peaks high */

    switch (tracker->current_phase) {
        case REP_PHASE_START: {
            bool in_starting_pos = !is_inversion ? (angle >= (ext_thresh - 10.0)) : (angle <= (ext_thresh + 10.0));
            if (in_starting_pos) {
                tracker->starting_angle_deg = angle;
                tracker->peak_inflection_angle_deg = angle;
            }

            /* Transition to eccentric/moving phase */
            bool started_motion = !is_inversion ? (angle < (ext_thresh - 15.0)) : (angle > (ext_thresh + 15.0));
            if (started_motion) {
                tracker->current_phase = REP_PHASE_ECCENTRIC;
                tracker->rep_start_time_sec = current_time_sec;
                tracker->peak_inflection_angle_deg = angle;
            }
            break;
        }

        case REP_PHASE_ECCENTRIC: {
            tracker->current_rep_duration_sec = current_time_sec - tracker->rep_start_time_sec;

            /* Track apex/trough peak angle reached */
            if (!is_inversion) {
                if (angle < tracker->peak_inflection_angle_deg) {
                    tracker->peak_inflection_angle_deg = angle;
                }
            } else {
                if (angle > tracker->peak_inflection_angle_deg) {
                    tracker->peak_inflection_angle_deg = angle;
                }
            }

            /* Check inflection threshold reached */
            bool reached_inflection = !is_inversion ? (angle <= cont_thresh) : (angle >= cont_thresh);
            if (reached_inflection) {
                tracker->current_phase = REP_PHASE_INFLECTION;
            } else if (tracker->current_rep_duration_sec > tracker->config.max_rep_duration_sec) {
                /* Timeout reset */
                tracker->current_phase = REP_PHASE_START;
            }
            break;
        }

        case REP_PHASE_INFLECTION: {
            tracker->current_rep_duration_sec = current_time_sec - tracker->rep_start_time_sec;

            /* Update peak */
            if (!is_inversion) {
                if (angle < tracker->peak_inflection_angle_deg) tracker->peak_inflection_angle_deg = angle;
            } else {
                if (angle > tracker->peak_inflection_angle_deg) tracker->peak_inflection_angle_deg = angle;
            }

            /* Moving back up towards full extension */
            bool returning = !is_inversion ? (angle > (cont_thresh + 12.0)) : (angle < (cont_thresh - 12.0));
            if (returning) {
                tracker->current_phase = REP_PHASE_CONCENTRIC;
            }
            break;
        }

        case REP_PHASE_CONCENTRIC: {
            tracker->current_rep_duration_sec = current_time_sec - tracker->rep_start_time_sec;

            /* Check return to full extension */
            bool reached_full_ext = !is_inversion ? (angle >= (ext_thresh - tracker->config.acceptable_rom_margin_deg))
                                                  : (angle <= (ext_thresh + tracker->config.acceptable_rom_margin_deg));

            if (reached_full_ext) {
                /* Validate debounce time */
                if (tracker->current_rep_duration_sec >= tracker->config.min_rep_duration_sec) {
                    tracker->completed_reps++;
                    rep_registered = true;
                    tracker->current_phase = REP_PHASE_COMPLETED;

                    /* Evaluate Form Quality */
                    double rom_achieved = fabs(tracker->starting_angle_deg - tracker->peak_inflection_angle_deg);
                    double rom_target = fabs(ext_thresh - cont_thresh);
                    double rom_ratio = (rom_target > 0) ? (rom_achieved / rom_target) : 1.0;
                    if (rom_ratio > 1.0) rom_ratio = 1.0;

                    double duration = tracker->current_rep_duration_sec;
                    double tempo_score = 1.0;
                    if (duration < 1.2) tempo_score = 0.8; /* Too fast */
                    else if (duration > 5.0) tempo_score = 0.85; /* Slower */

                    double form_score = (rom_ratio * 75.0) + (tempo_score * 25.0);
                    if (form_score > 100.0) form_score = 100.0;
                    tracker->live_form_score_pct = form_score;

                    RepFormRating rating = FORM_PERFECT;
                    if (form_score < 70.0) {
                        rating = FORM_PARTIAL_ROM;
                        if (tracker->alert_queue) {
                            alert_queue_push(tracker->alert_queue, ALERT_CAUTION, CAT_POSE_ALIGNMENT,
                                             form_score, "FORM WARNING: Incomplete ROM (Peak angle: %.1f*). Full extension required.",
                                             tracker->peak_inflection_angle_deg);
                        }
                    } else if (form_score < 85.0) {
                        rating = FORM_GOOD;
                    }

                    /* Log into Dynamic Array History */
                    if (tracker->history) {
                        RepLogEntry entry;
                        entry.rep_number = tracker->completed_reps;
                        strncpy(entry.exercise_name, tracker->name, sizeof(entry.exercise_name) - 1);
                        entry.duration_seconds = duration;
                        entry.inflection_angle_deg = tracker->peak_inflection_angle_deg;
                        entry.extension_angle_deg = tracker->starting_angle_deg;
                        entry.form_score_pct = form_score;
                        entry.fatigue_at_rep_pct = tracker->fatigue_scaling.composite_fatigue_pct;
                        entry.rating = rating;
                        entry.timestamp_sec = (unsigned long)current_time_sec;
                        rep_history_append(tracker->history, &entry);
                    }

                    /* Inform queue on completion */
                    if (tracker->alert_queue) {
                        alert_queue_push(tracker->alert_queue, ALERT_INFO, CAT_CADENCE_PACING,
                                         (double)tracker->completed_reps,
                                         "REP #%d COMPLETED (%s) | Duration: %.2fs | Form: %.1f%%",
                                         tracker->completed_reps, tracker->name, duration, form_score);
                    }
                }
                /* Reset phase to start */
                tracker->current_phase = REP_PHASE_START;
            } else if (tracker->current_rep_duration_sec > tracker->config.max_rep_duration_sec) {
                tracker->current_phase = REP_PHASE_START;
            }
            break;
        }

        case REP_PHASE_COMPLETED:
            tracker->current_phase = REP_PHASE_START;
            break;
    }

    return rep_registered;
}

void tracker_render_hud(const ExerciseTracker* tracker) {
    if (!tracker) return;

    const char* phase_str = "START";
    switch (tracker->current_phase) {
        case REP_PHASE_START:      phase_str = "NEUTRAL START  "; break;
        case REP_PHASE_ECCENTRIC:  phase_str = "ECCENTRIC DOWN "; break;
        case REP_PHASE_INFLECTION: phase_str = "PEAK INFLECTION"; break;
        case REP_PHASE_CONCENTRIC: phase_str = "CONCENTRIC UP  "; break;
        case REP_PHASE_COMPLETED:  phase_str = "REP CONFIRMED  "; break;
    }

    /* ASCII Gauge Bar for Angle */
    int bar_width = 30;
    double min_a = 30.0;
    double max_a = 180.0;
    double fraction = (tracker->smoothed_angle_deg - min_a) / (max_a - min_a);
    if (fraction < 0.0) fraction = 0.0;
    if (fraction > 1.0) fraction = 1.0;
    int fill = (int)(fraction * bar_width);

    printf("\n  +--- LIVE BIOMECHANICAL POSE HUD: %-15s ---+\n", tracker->name);
    printf("  | Joint Angle Theta : %6.1f* (Raw: %5.1f*)                          |\n",
           tracker->smoothed_angle_deg, tracker->raw_angle_deg);
    
    printf("  | Angle Gauge       : [");
    for (int i = 0; i < bar_width; ++i) {
        if (i < fill) printf("=");
        else if (i == fill) printf("O");
        else printf(" ");
    }
    printf("] %3.0f*      |\n", tracker->smoothed_angle_deg);

    printf("  | FSM Phase         : %-20s                     |\n", phase_str);
    printf("  | Progress          : Reps: %2d / %-2d (Planned: %2d)                     |\n",
           tracker->completed_reps, tracker->target_reps, tracker->planned_target_reps);
    printf("  | Live Form Quality : %5.1f%%                                        |\n",
           tracker->live_form_score_pct);
    printf("  | Fatigue Telemetry : %5.1f%% (Zone: %-8s)                     |\n",
           tracker->fatigue_scaling.composite_fatigue_pct,
           (tracker->fatigue_scaling.zone == FATIGUE_ZONE_EXHAUSTED ? "EXHAUSTED" :
            tracker->fatigue_scaling.zone == FATIGUE_ZONE_CRITICAL  ? "CRITICAL"  :
            tracker->fatigue_scaling.zone == FATIGUE_ZONE_ELEVATED  ? "ELEVATED"  : "OPTIMAL"));

    if (tracker->fatigue_scaling.requires_intervention) {
        printf("  | Fatigue Warning   : %-48.48s |\n", tracker->fatigue_scaling.recommendation_text);
    }
    printf("  +-------------------------------------------------------------+\n");
}
