/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: demo_pose.h
 * Description: Reference Demo Pose Benchmarks, Euclidean Distance & Form Accuracy Engine
 * ============================================================================
 */

#ifndef AURAFIT_DEMO_POSE_H
#define AURAFIT_DEMO_POSE_H

#include "vector_math.h"
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Standard Demo Pose Identifier */
typedef enum {
    DEMO_POSE_PUSHUP_BOTTOM = 0,   /**< Pushup bottom: 90° elbow flexion, 180° straight spine */
    DEMO_POSE_PUSHUP_TOP,          /**< Pushup top: 165° elbow extension, 180° spine */
    DEMO_POSE_SQUAT_DEPTH,         /**< Squat bottom: 85° knee parallel depth, upright torso */
    DEMO_POSE_SQUAT_STANDING,      /**< Squat top: 170° knee extension */
    DEMO_POSE_PLANK_HOLD,          /**< Plank hold: 90° elbow ground angle, 180° hip/spine alignment */
    DEMO_POSE_BICEP_PEAK,          /**< Bicep curl peak contraction: 45° elbow angle */
    DEMO_POSE_COUNT
} DemoPoseID;

/**
 * @brief Benchmark Demo Pose Struct
 * Defines standard target landmark coordinates and target joint angles for exercises.
 */
typedef struct {
    DemoPoseID id;
    char exercise_name[32];          /**< "Pushup", "Squat", "Plank", etc. */
    char phase_name[48];             /**< "Bottom Inflection", "Parallel Depth", "Core Hold" */
    
    /* Target Benchmark Angles */
    double target_primary_angle_deg;    /**< Primary joint angle (e.g. 90.0° for pushup elbow) */
    double target_secondary_angle_deg;  /**< Secondary joint angle (e.g. 180.0° for spine/hip) */
    double angle_tolerance_deg;         /**< Target acceptance tolerance window (e.g. 12.0°) */

    /* Target Benchmark Landmark Coordinates (Normalized 2D space) */
    Point2D target_joint_a;             /**< Anchor joint (e.g. Shoulder or Hip) */
    Point2D target_joint_b;             /**< Vertex joint (e.g. Elbow or Knee) */
    Point2D target_joint_c;             /**< End joint (e.g. Wrist or Ankle) */
    Point2D target_spine_ref;           /**< Secondary spine landmark (e.g. Hip or Shoulder) */

    /* Coaching Feedback Templates */
    char feedback_perfect[96];          /**< "95% Match - Perfect Form! Textbook execution." */
    char feedback_high_angle[96];       /**< "Angle too open - lower deeper to match Demo Pose." */
    char feedback_low_angle[96];        /**< "Over-flexed - control movement, don't collapse." */
    char feedback_misaligned[96];       /**< "Spine misaligned - lower your hips to match Demo Pose." */
} DemoPose;

/**
 * @brief Real-Time Form Accuracy Evaluation Report
 */
typedef struct {
    DemoPoseID demo_id;
    char exercise_name[32];
    char phase_name[48];

    /* Angle Telemetry */
    double target_primary_angle_deg;
    double real_time_primary_angle_deg;
    double primary_angular_delta_deg;

    double target_secondary_angle_deg;
    double real_time_secondary_angle_deg;
    double secondary_angular_delta_deg;

    /* Euclidean Coordinate Distance Metrics */
    double euclidean_distance_a;
    double euclidean_distance_b;
    double euclidean_distance_c;
    double avg_euclidean_distance;

    /* Accuracy Component Scores [0.0% to 100.0%] */
    double angle_accuracy_pct;
    double coordinate_accuracy_pct;
    double composite_accuracy_pct;

    /* Dynamic Coaching Guidance */
    char guidance_message[128];
    bool is_form_acceptable;
} FormAccuracyReport;

/* --- Demo Pose Benchmark Library API --- */

/**
 * @brief Retrieves the preconfigured standard Demo Pose benchmark by ID.
 */
const DemoPose* demo_pose_get_benchmark(DemoPoseID id);

/**
 * @brief Retrieves the benchmark Demo Pose associated with an exercise type and phase.
 */
const DemoPose* demo_pose_get_by_exercise(const char* exercise_name, bool is_inflection_phase);

/**
 * @brief Calculates Euclidean coordinate distance between two 2D points.
 *        distance = sqrt((x1 - x2)^2 + (y1 - y2)^2)
 */
double demo_pose_calc_euclidean_distance(Point2D p1, Point2D p2);

/**
 * @brief Form Accuracy Engine: Compares real-time user kinematics against Demo Pose benchmark.
 * 
 * Computes:
 *  1. Angular deviation from benchmark target angle
 *  2. Euclidean coordinate distance across anatomical joints
 *  3. Form Accuracy Percentage (0% to 100%)
 *  4. Dynamic coaching guidance message based on score and kinematic fault
 * 
 * @param demo Active benchmark Demo Pose
 * @param user_joint_a Real-time anchor joint (e.g. Shoulder)
 * @param user_joint_b Real-time vertex joint (e.g. Elbow)
 * @param user_joint_c Real-time end joint (e.g. Wrist)
 * @param user_spine_ref Optional spine alignment point (or NULL/invalid)
 * @param user_primary_angle Real-time computed primary joint angle in degrees
 * @param report Output report struct populated with evaluation metrics
 */
void demo_pose_evaluate_form(const DemoPose* demo,
                             Point2D user_joint_a,
                             Point2D user_joint_b,
                             Point2D user_joint_c,
                             Point2D user_spine_ref,
                             double user_primary_angle,
                             FormAccuracyReport* report);

/**
 * @brief Prints a formatted side-by-side console display comparing Demo Pose vs User Pose.
 */
void demo_pose_print_comparison_hud(const FormAccuracyReport* report);

#ifdef __cplusplus
}
#endif

#endif /* AURAFIT_DEMO_POSE_H */
