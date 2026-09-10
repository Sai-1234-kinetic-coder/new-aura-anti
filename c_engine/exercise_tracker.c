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

        case EXERCISE_PLANK:
            strncpy(tracker->name, "Plank Hold", sizeof(tracker->name) - 1);
            tracker->config.extension_threshold_deg = 90.0;
            tracker->config.contraction_threshold_deg = 90.0;
            tracker->config.min_rep_duration_sec = 2.0;
            tracker->config.max_rep_duration_sec = 120.0;
            tracker->config.acceptable_rom_margin_deg = 10.0;
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
    double prev_angle = tracker->smoothed_angle_deg;
    double angle = angle_smoother_update(&tracker->smoother, raw);
    tracker->smoothed_angle_deg = angle;

    /* Calculate angular velocity */
    double dt = current_time_sec - tracker->last_frame_time_sec;
    if (dt > 1e-4 && tracker->last_frame_time_sec > 0.0) {
        tracker->live_velocity_deg_per_sec = fabs(angle - prev_angle) / dt;
    }
    tracker->last_frame_time_sec = current_time_sec;

    /* Track keypoints */
    tracker->last_joint_a = joint_a;
    tracker->last_joint_b = joint_b;
    tracker->last_joint_c = joint_c;

    /* Form Accuracy & Reference Demo Pose Benchmark Comparison */
    bool is_inflection = (tracker->current_phase == REP_PHASE_INFLECTION || tracker->current_phase == REP_PHASE_ECCENTRIC);
    tracker->active_demo_pose = demo_pose_get_by_exercise(tracker->name, is_inflection);
    Point2D dummy_spine = { .is_valid = false };
    demo_pose_evaluate_form(tracker->active_demo_pose, joint_a, joint_b, joint_c, dummy_spine, angle, &tracker->last_form_report);
    tracker->live_form_score_pct = tracker->last_form_report.composite_accuracy_pct;

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

            /* Track minimum or maximum inflection reached */
            if (!is_inversion) {
                if (angle < tracker->peak_inflection_angle_deg) {
                    tracker->peak_inflection_angle_deg = angle;
                }
            } else {
                if (angle > tracker->peak_inflection_angle_deg) {
                    tracker->peak_inflection_angle_deg = angle;
                }
            }

            /* Check if target contraction boundary reached */
            bool reached_contraction = !is_inversion ? 
                (angle <= (cont_thresh + tracker->config.acceptable_rom_margin_deg)) :
                (angle >= (cont_thresh - tracker->config.acceptable_rom_margin_deg));

            if (reached_contraction) {
                tracker->current_phase = REP_PHASE_INFLECTION;
            } else if (tracker->current_rep_duration_sec > tracker->config.max_rep_duration_sec) {
                /* Reset if rep stalls */
                tracker->current_phase = REP_PHASE_START;
            }
            break;
        }

        case REP_PHASE_INFLECTION: {
            tracker->current_rep_duration_sec = current_time_sec - tracker->rep_start_time_sec;

            /* Moving back towards extension begins concentric phase */
            bool return_motion = !is_inversion ? 
                (angle > (tracker->peak_inflection_angle_deg + 10.0)) :
                (angle < (tracker->peak_inflection_angle_deg - 10.0));

            if (return_motion) {
                tracker->current_phase = REP_PHASE_CONCENTRIC;
            }
            break;
        }

        case REP_PHASE_CONCENTRIC: {
            tracker->current_rep_duration_sec = current_time_sec - tracker->rep_start_time_sec;

            /* Check return to extension threshold */
            bool returned_to_start = !is_inversion ? 
                (angle >= (ext_thresh - 15.0)) :
                (angle <= (ext_thresh + 15.0));

            if (returned_to_start) {
                /* Validate rep duration (debounce against rapid twitching) */
                if (tracker->current_rep_duration_sec >= tracker->config.min_rep_duration_sec) {
                    tracker->current_phase = REP_PHASE_COMPLETED;
                    tracker->completed_reps++;
                    rep_registered = true;

                    /* Evaluate form rating based on Demo Pose accuracy */
                    FormRating rating = FORM_ADEQUATE;
                    if (tracker->live_form_score_pct >= 90.0) rating = FORM_PERFECT;
                    else if (tracker->live_form_score_pct >= 75.0) rating = FORM_GOOD;
                    else if (tracker->live_form_score_pct < 60.0) rating = FORM_POOR;

                    /* Log to dynamic rep history */
                    if (tracker->history) {
                        RepLogEntry entry;
                        entry.rep_number = tracker->completed_reps;
                        strncpy(entry.exercise_name, tracker->name, sizeof(entry.exercise_name) - 1);
                        entry.duration_seconds = tracker->current_rep_duration_sec;
                        entry.form_score_pct = tracker->live_form_score_pct;
                        entry.fatigue_at_rep_pct = tracker->fatigue_scaling.composite_fatigue_pct;
                        entry.rating = rating;
                        rep_history_append(tracker->history, &entry);
                    }

                    /* Dispatch feedback alert */
                    if (tracker->alert_queue) {
                        if (rating == FORM_PERFECT) {
                            alert_queue_push(tracker->alert_queue, ALERT_INFO, CAT_POSE_ALIGNMENT,
                                             tracker->live_form_score_pct,
                                             "REP #%d: %s",
                                             tracker->completed_reps, tracker->last_form_report.guidance_message);
                        } else if (rating == FORM_POOR) {
                            alert_queue_push(tracker->alert_queue, ALERT_WARNING, CAT_POSE_ALIGNMENT,
                                             tracker->live_form_score_pct,
                                             "REP #%d: %s",
                                             tracker->completed_reps, tracker->last_form_report.guidance_message);
                        }
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
        case REP_PHASE_ECCENTRIC:  phase_str = "ECCENTRIC LOAD "; break;
        case REP_PHASE_INFLECTION: phase_str = "PEAK INFLECTION"; break;
        case REP_PHASE_CONCENTRIC: phase_str = "CONCENTRIC UP  "; break;
        case REP_PHASE_COMPLETED:  phase_str = "REP CONFIRMED  "; break;
    }

    /* ASCII Gauge Bar for Angle */
    int bar_width = 24;
    double min_a = 30.0;
    double max_a = 180.0;
    double fraction = (tracker->smoothed_angle_deg - min_a) / (max_a - min_a);
    if (fraction < 0.0) fraction = 0.0;
    if (fraction > 1.0) fraction = 1.0;
    int fill = (int)(fraction * bar_width);

    printf("\n  +--- LIVE BIOMECHANICAL POSE HUD: %-15s ---+\n", tracker->name);
    printf("  | FSM Phase         : %-22s                    |\n", phase_str);
    printf("  | Progress          : Reps: %2d / %-2d (Planned: %2d)                    |\n",
           tracker->completed_reps, tracker->target_reps, tracker->planned_target_reps);

    /* Side-by-Side Target Angle vs User Angle */
    if (tracker->active_demo_pose) {
        printf("  | ------------------------------------------------------------- |\n");
        printf("  | [DEMO POSE TARGET] vs [USER REAL-TIME KINEMATICS]             |\n");
        printf("  | Target Angle      : %5.1f* (Phase: %-23.23s) |\n",
               tracker->active_demo_pose->target_primary_angle_deg, tracker->active_demo_pose->phase_name);
        printf("  | User Live Angle   : %5.1f* (Delta: %+5.1f*, Vel: %4.0f*/s)         |\n",
               tracker->smoothed_angle_deg, tracker->last_form_report.primary_angular_delta_deg,
               tracker->live_velocity_deg_per_sec);
        printf("  | Joint Coordinate  : Target [%4.2f, %4.2f]  User [%4.2f, %4.2f]       |\n",
               tracker->active_demo_pose->target_joint_b.x, tracker->active_demo_pose->target_joint_b.y,
               tracker->last_joint_b.x, tracker->last_joint_b.y);
        printf("  | Euclid Coord Dist : %5.3f norm units                            |\n",
               tracker->last_form_report.avg_euclidean_distance);
        printf("  | Form Accuracy     : %5.1f%% %-32s |\n",
               tracker->last_form_report.composite_accuracy_pct,
               (tracker->last_form_report.composite_accuracy_pct >= 85.0 ? "[EXCELLENT MATCH]" :
                tracker->last_form_report.composite_accuracy_pct >= 70.0 ? "[GOOD FORM]" : "[DEVIATION]"));
        printf("  | Dynamic Guidance  : %-41.41s |\n", tracker->last_form_report.guidance_message);
        printf("  | ------------------------------------------------------------- |\n");
    } else {
        printf("  | Joint Angle Theta : %6.1f* (Raw: %5.1f*)                          |\n",
               tracker->smoothed_angle_deg, tracker->raw_angle_deg);
        printf("  | Live Form Quality : %5.1f%%                                        |\n",
               tracker->live_form_score_pct);
    }

    printf("  | Angle Arc Gauge   : [");
    for (int i = 0; i < bar_width; ++i) {
        if (i < fill) printf("=");
        else if (i == fill) printf("O");
        else printf(" ");
    }
    printf("] %3.0f*     |\n", tracker->smoothed_angle_deg);

    printf("  | Fatigue Telemetry : %5.1f%% (Zone: %-8s)                     |\n",
           tracker->fatigue_scaling.composite_fatigue_pct,
           (tracker->fatigue_scaling.zone == FATIGUE_ZONE_EXHAUSTED ? "EXHAUSTED" :
            tracker->fatigue_scaling.zone == FATIGUE_ZONE_CRITICAL  ? "CRITICAL"  :
            tracker->fatigue_scaling.zone == FATIGUE_ZONE_ELEVATED  ? "ELEVATED"  : "OPTIMAL"));

    if (tracker->fatigue_scaling.requires_intervention) {
        printf("  | Fatigue Alert     : %-48.48s |\n", tracker->fatigue_scaling.recommendation_text);
    }
    printf("  +-------------------------------------------------------------+\n");
}
