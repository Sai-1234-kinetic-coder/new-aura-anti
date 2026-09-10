/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: demo_pose.c
 * Description: Reference Demo Pose Benchmarks, Euclidean Distance & Form Accuracy Engine
 * ============================================================================
 */

#include "demo_pose.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

/* Static benchmark table */
static const DemoPose DEMO_BENCHMARKS[DEMO_POSE_COUNT] = {
    /* 0: Pushup Bottom Inflection */
    {
        .id = DEMO_POSE_PUSHUP_BOTTOM,
        .exercise_name = "Pushup",
        .phase_name = "Bottom Inflection (Chest to Floor)",
        .target_primary_angle_deg = 90.0,
        .target_secondary_angle_deg = 180.0,
        .angle_tolerance_deg = 10.0,
        .target_joint_a = { .x = 0.30, .y = 0.65, .confidence = 1.0f, .is_valid = true }, /* Shoulder */
        .target_joint_b = { .x = 0.45, .y = 0.65, .confidence = 1.0f, .is_valid = true }, /* Elbow */
        .target_joint_c = { .x = 0.45, .y = 0.80, .confidence = 1.0f, .is_valid = true }, /* Wrist */
        .target_spine_ref = { .x = 0.65, .y = 0.65, .confidence = 1.0f, .is_valid = true }, /* Hip */
        .feedback_perfect = "95% Match - Perfect Form! 90° elbow depth with rigid core.",
        .feedback_high_angle = "Angle too open! Lower your chest further to hit 90° elbow flexion.",
        .feedback_low_angle = "Over-flexed! Avoid collapsing onto the floor; push through palms.",
        .feedback_misaligned = "Lower your hips to match Demo Pose straight spine alignment."
    },
    /* 1: Pushup Top Lockout */
    {
        .id = DEMO_POSE_PUSHUP_TOP,
        .exercise_name = "Pushup",
        .phase_name = "Top Extension (Arms Extended)",
        .target_primary_angle_deg = 165.0,
        .target_secondary_angle_deg = 180.0,
        .angle_tolerance_deg = 12.0,
        .target_joint_a = { .x = 0.41, .y = 0.505, .confidence = 1.0f, .is_valid = true },
        .target_joint_b = { .x = 0.45, .y = 0.65, .confidence = 1.0f, .is_valid = true },
        .target_joint_c = { .x = 0.45, .y = 0.80, .confidence = 1.0f, .is_valid = true },
        .target_spine_ref = { .x = 0.66, .y = 0.505, .confidence = 1.0f, .is_valid = true },
        .feedback_perfect = "96% Match - Perfect Extension! Stable locked core and shoulders.",
        .feedback_high_angle = "Do not hyperextend elbows; maintain soft joint lockout.",
        .feedback_low_angle = "Complete full extension at top of rep before descending.",
        .feedback_misaligned = "Hips sagging! Tighten glutes to maintain straight plank line."
    },
    /* 2: Squat Parallel Depth */
    {
        .id = DEMO_POSE_SQUAT_DEPTH,
        .exercise_name = "Squat",
        .phase_name = "Parallel Depth (Hip Crease at Knee)",
        .target_primary_angle_deg = 85.0,
        .target_secondary_angle_deg = 70.0, /* Torso inclination */
        .angle_tolerance_deg = 10.0,
        .target_joint_a = { .x = 0.28, .y = 0.70, .confidence = 1.0f, .is_valid = true }, /* Hip */
        .target_joint_b = { .x = 0.52, .y = 0.68, .confidence = 1.0f, .is_valid = true }, /* Knee */
        .target_joint_c = { .x = 0.52, .y = 0.90, .confidence = 1.0f, .is_valid = true }, /* Ankle */
        .target_spine_ref = { .x = 0.28, .y = 0.70, .confidence = 1.0f, .is_valid = true },
        .feedback_perfect = "95% Match - Perfect Form! Thighs parallel to deck, neutral spine.",
        .feedback_high_angle = "Squat too shallow! Descend lower until knee angle reaches ~85°.",
        .feedback_low_angle = "Deep squat reached! Ensure knees do not cave inwards (valgus).",
        .feedback_misaligned = "Chest collapsing forward! Elevate torso to match Demo Pose."
    },
    /* 3: Squat Standing Extension */
    {
        .id = DEMO_POSE_SQUAT_STANDING,
        .exercise_name = "Squat",
        .phase_name = "Standing Neutral Lockout",
        .target_primary_angle_deg = 170.0,
        .target_secondary_angle_deg = 90.0,
        .angle_tolerance_deg = 12.0,
        .target_joint_a = { .x = 0.48, .y = 0.44, .confidence = 1.0f, .is_valid = true },
        .target_joint_b = { .x = 0.52, .y = 0.68, .confidence = 1.0f, .is_valid = true },
        .target_joint_c = { .x = 0.52, .y = 0.90, .confidence = 1.0f, .is_valid = true },
        .target_spine_ref = { .x = 0.48, .y = 0.44, .confidence = 1.0f, .is_valid = true },
        .feedback_perfect = "97% Match - Solid standing lockout. Ready for next repetition.",
        .feedback_high_angle = "Avoid knee hyperextension.",
        .feedback_low_angle = "Stand up completely to complete full rep lockout.",
        .feedback_misaligned = "Weight off balance. Distribute evenly across midfoot."
    },
    /* 4: Plank Isometric Core Hold */
    {
        .id = DEMO_POSE_PLANK_HOLD,
        .exercise_name = "Plank",
        .phase_name = "Isometric Core Hold",
        .target_primary_angle_deg = 90.0,   /* Elbow right angle to deck */
        .target_secondary_angle_deg = 180.0, /* Shoulder-Hip-Ankle 180° straight line */
        .angle_tolerance_deg = 8.0,
        .target_joint_a = { .x = 0.35, .y = 0.55, .confidence = 1.0f, .is_valid = true }, /* Shoulder */
        .target_joint_b = { .x = 0.35, .y = 0.70, .confidence = 1.0f, .is_valid = true }, /* Elbow */
        .target_joint_c = { .x = 0.50, .y = 0.70, .confidence = 1.0f, .is_valid = true }, /* Wrist/Hand */
        .target_spine_ref = { .x = 0.65, .y = 0.55, .confidence = 1.0f, .is_valid = true }, /* Hip */
        .feedback_perfect = "95% Match - Perfect Form! Rigid abdominal brace & straight spine.",
        .feedback_high_angle = "Elbow angle too obtuse! Position elbows directly under shoulders.",
        .feedback_low_angle = "Elbow angle compressed! Maintain 90° forearm base.",
        .feedback_misaligned = "Lower your hips to match Demo Pose straight spine alignment."
    },
    /* 5: Bicep Curl Peak */
    {
        .id = DEMO_POSE_BICEP_PEAK,
        .exercise_name = "Bicep Curl",
        .phase_name = "Peak Concentric Contraction",
        .target_primary_angle_deg = 45.0,
        .target_secondary_angle_deg = 0.0,
        .angle_tolerance_deg = 12.0,
        .target_joint_a = { .x = 0.50, .y = 0.30, .confidence = 1.0f, .is_valid = true },
        .target_joint_b = { .x = 0.50, .y = 0.55, .confidence = 1.0f, .is_valid = true },
        .target_joint_c = { .x = 0.50, .y = 0.35, .confidence = 1.0f, .is_valid = true },
        .target_spine_ref = { .x = 0.50, .y = 0.60, .confidence = 1.0f, .is_valid = true },
        .feedback_perfect = "95% Match - Perfect Form! Peak bicep squeeze achieved.",
        .feedback_high_angle = "Curl higher! Contract forearm closer to shoulder.",
        .feedback_low_angle = "Over-curling into shoulder flexion! Keep elbows pinned to ribs.",
        .feedback_misaligned = "Upper body swinging! Stabilize torso and engage core."
    }
};

const DemoPose* demo_pose_get_benchmark(DemoPoseID id) {
    if (id < 0 || id >= DEMO_POSE_COUNT) {
        return &DEMO_BENCHMARKS[DEMO_POSE_PUSHUP_BOTTOM];
    }
    return &DEMO_BENCHMARKS[id];
}

const DemoPose* demo_pose_get_by_exercise(const char* exercise_name, bool is_inflection_phase) {
    if (!exercise_name) return &DEMO_BENCHMARKS[DEMO_POSE_PUSHUP_BOTTOM];

    if (strstr(exercise_name, "Pushup") || strstr(exercise_name, "pushup") || strstr(exercise_name, "Push-up")) {
        return is_inflection_phase ? &DEMO_BENCHMARKS[DEMO_POSE_PUSHUP_BOTTOM] : &DEMO_BENCHMARKS[DEMO_POSE_PUSHUP_TOP];
    }
    if (strstr(exercise_name, "Squat") || strstr(exercise_name, "squat")) {
        return is_inflection_phase ? &DEMO_BENCHMARKS[DEMO_POSE_SQUAT_DEPTH] : &DEMO_BENCHMARKS[DEMO_POSE_SQUAT_STANDING];
    }
    if (strstr(exercise_name, "Plank") || strstr(exercise_name, "plank")) {
        return &DEMO_BENCHMARKS[DEMO_POSE_PLANK_HOLD];
    }
    if (strstr(exercise_name, "Curl") || strstr(exercise_name, "curl")) {
        return &DEMO_BENCHMARKS[DEMO_POSE_BICEP_PEAK];
    }

    return &DEMO_BENCHMARKS[DEMO_POSE_PUSHUP_BOTTOM];
}

double demo_pose_calc_euclidean_distance(Point2D p1, Point2D p2) {
    double dx = p1.x - p2.x;
    double dy = p1.y - p2.y;
    return sqrt(dx * dx + dy * dy);
}

void demo_pose_evaluate_form(const DemoPose* demo,
                             Point2D user_joint_a,
                             Point2D user_joint_b,
                             Point2D user_joint_c,
                             Point2D user_spine_ref,
                             double user_primary_angle,
                             FormAccuracyReport* report) {
    if (!report) return;
    if (!demo) demo = &DEMO_BENCHMARKS[DEMO_POSE_PUSHUP_BOTTOM];

    memset(report, 0, sizeof(FormAccuracyReport));
    report->demo_id = demo->id;
    strncpy(report->exercise_name, demo->exercise_name, sizeof(report->exercise_name) - 1);
    strncpy(report->phase_name, demo->phase_name, sizeof(report->phase_name) - 1);

    /* 1. Primary Angle Accuracy */
    report->target_primary_angle_deg = demo->target_primary_angle_deg;
    report->real_time_primary_angle_deg = user_primary_angle;
    report->primary_angular_delta_deg = user_primary_angle - demo->target_primary_angle_deg;
    double abs_angle_delta = fabs(report->primary_angular_delta_deg);

    /* Angle accuracy scoring: within tolerance = 92% to 100%, drops linearly */
    double angle_score = 0.0;
    if (abs_angle_delta <= demo->angle_tolerance_deg) {
        angle_score = 100.0 - (abs_angle_delta / demo->angle_tolerance_deg) * 8.0;
    } else {
        double excess = abs_angle_delta - demo->angle_tolerance_deg;
        double max_excess_allowed = 45.0; /* beyond this, angle score is 0 */
        if (excess >= max_excess_allowed) {
            angle_score = 0.0;
        } else {
            angle_score = 92.0 * (1.0 - (excess / max_excess_allowed));
        }
    }
    if (angle_score < 0.0) angle_score = 0.0;
    if (angle_score > 100.0) angle_score = 100.0;
    report->angle_accuracy_pct = angle_score;

    /* 2. Secondary Spine Alignment Angle (if landmark available) */
    bool has_secondary = false;
    double secondary_score = 100.0;
    if (user_spine_ref.is_valid && demo->target_secondary_angle_deg > 0.0) {
        has_secondary = true;
        report->target_secondary_angle_deg = demo->target_secondary_angle_deg;

        /* Spine alignment: evaluate vertical hip deviation relative to shoulder plane */
        double hip_y_dev = fabs(user_spine_ref.y - user_joint_a.y);
        double sec_angle = 180.0 - (hip_y_dev / 0.15) * 45.0;
        if (sec_angle < 90.0) sec_angle = 90.0;
        if (sec_angle > 180.0) sec_angle = 180.0;
        report->real_time_secondary_angle_deg = sec_angle;
        report->secondary_angular_delta_deg = report->real_time_secondary_angle_deg - demo->target_secondary_angle_deg;
        double abs_sec_delta = fabs(report->secondary_angular_delta_deg);

        if (abs_sec_delta <= 10.0) {
            secondary_score = 100.0 - (abs_sec_delta / 10.0) * 8.0;
        } else {
            secondary_score = 92.0 - ((abs_sec_delta - 10.0) / 35.0) * 92.0;
        }
        if (secondary_score < 0.0) secondary_score = 0.0;
    }

    /* 3. Euclidean Coordinate Distance Scoring */
    report->euclidean_distance_a = demo_pose_calc_euclidean_distance(user_joint_a, demo->target_joint_a);
    report->euclidean_distance_b = demo_pose_calc_euclidean_distance(user_joint_b, demo->target_joint_b);
    report->euclidean_distance_c = demo_pose_calc_euclidean_distance(user_joint_c, demo->target_joint_c);
    report->avg_euclidean_distance = (report->euclidean_distance_a +
                                      report->euclidean_distance_b +
                                      report->euclidean_distance_c) / 3.0;

    /* Normalize Euclidean coordinate accuracy: 0.0m = 100%, 0.25m = 0% */
    double max_dist_tolerance = 0.25;
    double coord_score = (1.0 - (report->avg_euclidean_distance / max_dist_tolerance)) * 100.0;
    if (coord_score < 0.0) coord_score = 0.0;
    if (coord_score > 100.0) coord_score = 100.0;
    report->coordinate_accuracy_pct = coord_score;

    /* 4. Composite Form Accuracy Percentage */
    if (has_secondary) {
        report->composite_accuracy_pct = (0.50 * angle_score) +
                                         (0.30 * coord_score) +
                                         (0.20 * secondary_score);
    } else {
        report->composite_accuracy_pct = (0.60 * angle_score) +
                                         (0.40 * coord_score);
    }
    if (report->composite_accuracy_pct < 0.0) report->composite_accuracy_pct = 0.0;
    if (report->composite_accuracy_pct > 100.0) report->composite_accuracy_pct = 100.0;

    report->is_form_acceptable = (report->composite_accuracy_pct >= 75.0);

    /* 5. Dynamic Coaching Guidance Message Generation */
    int rounded_score = (int)(report->composite_accuracy_pct + 0.5);

    if (has_secondary && fabs(report->secondary_angular_delta_deg) > 18.0) {
        snprintf(report->guidance_message, sizeof(report->guidance_message),
                 "%d%% Match - %s", rounded_score, demo->feedback_misaligned);
    } else if (rounded_score >= 90) {
        snprintf(report->guidance_message, sizeof(report->guidance_message),
                 "%d%% Match - Perfect Form! Exact match with Demo Pose!", rounded_score);
    } else if (rounded_score >= 80) {
        snprintf(report->guidance_message, sizeof(report->guidance_message),
                 "%d%% Match - Great form! Solid depth and joint tracking.", rounded_score);
    } else if (report->primary_angular_delta_deg > demo->angle_tolerance_deg) {
        snprintf(report->guidance_message, sizeof(report->guidance_message),
                 "%d%% Match - %s", rounded_score, demo->feedback_high_angle);
    } else if (report->primary_angular_delta_deg < -demo->angle_tolerance_deg) {
        snprintf(report->guidance_message, sizeof(report->guidance_message),
                 "%d%% Match - %s", rounded_score, demo->feedback_low_angle);
    } else {
        snprintf(report->guidance_message, sizeof(report->guidance_message),
                 "%d%% Match - Moderate form. Align joints closer to Demo Pose markers.", rounded_score);
    }
}

void demo_pose_print_comparison_hud(const FormAccuracyReport* report) {
    if (!report) return;

    printf("\n  +-----------------------------------------------------------------------------+\n");
    printf("  |                   REFERENCE DEMO POSE ACCURACY EVALUATION                   |\n");
    printf("  +-----------------------------------------------------------------------------+\n");
    printf("  | Benchmark  : %-12s | Phase: %-37s |\n", report->exercise_name, report->phase_name);
    printf("  +-----------------------------------------------------------------------------+\n");
    printf("  |  METRIC               DEMO TARGET        USER REAL-TIME     VARIANCE        |\n");
    printf("  |  -------------------  -----------------  -----------------  --------------  |\n");
    printf("  |  Primary Angle        %7.1f deg          %7.1f deg          %+6.1f deg      |\n",
           report->target_primary_angle_deg,
           report->real_time_primary_angle_deg,
           report->primary_angular_delta_deg);

    if (report->target_secondary_angle_deg > 0.0) {
        printf("  |  Spine Alignment      %7.1f deg          %7.1f deg          %+6.1f deg      |\n",
               report->target_secondary_angle_deg,
               report->real_time_secondary_angle_deg,
               report->secondary_angular_delta_deg);
    }

    printf("  |  Euclid Coord Dist    0.000 norm         %7.3f norm         +%5.3f norm     |\n",
           report->avg_euclidean_distance,
           report->avg_euclidean_distance);

    /* Visual progress bars */
    int angle_bars = (int)(report->angle_accuracy_pct / 4.0);
    if (angle_bars > 25) angle_bars = 25;
    char angle_bar_str[26];
    memset(angle_bar_str, '=', angle_bars);
    angle_bar_str[angle_bars] = '\0';

    int comp_bars = (int)(report->composite_accuracy_pct / 4.0);
    if (comp_bars > 25) comp_bars = 25;
    char comp_bar_str[26];
    memset(comp_bar_str, '=', comp_bars);
    comp_bar_str[comp_bars] = '\0';

    printf("  +-----------------------------------------------------------------------------+\n");
    printf("  |  Angle Match Score    : [%-25s] %5.1f%%                      |\n", angle_bar_str, report->angle_accuracy_pct);
    printf("  |  Coordinate Match     : [%-25s] %5.1f%%                      |\n", comp_bar_str, report->coordinate_accuracy_pct);
    printf("  |  COMPOSITE ACCURACY   : [%-25s] %5.1f%% %-5s                |\n",
           comp_bar_str, report->composite_accuracy_pct,
           report->is_form_acceptable ? "[PASS]" : "[WARN]");
    printf("  +-----------------------------------------------------------------------------+\n");
    printf("  |  DYNAMIC GUIDANCE:                                                          |\n");
    printf("  |  >>> %-70s |\n", report->guidance_message);
    printf("  +-----------------------------------------------------------------------------+\n\n");
}
