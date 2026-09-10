/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: exercise_tracker.h
 * Description: Biomechanical Pose State Machine & Dynamic Rep Counter FSM
 * ============================================================================
 */

#ifndef AURAFIT_EXERCISE_TRACKER_H
#define AURAFIT_EXERCISE_TRACKER_H

#include "vector_math.h"
#include "alert_queue.h"
#include "rep_history.h"
#include "fatigue_engine.h"
#include "demo_pose.h"

#ifdef __cplusplus
extern "C" {
#endif

/* Supported Exercise Types */
typedef enum {
    EXERCISE_BICEP_CURL = 0,   /**< Shoulder -> Elbow -> Wrist angle */
    EXERCISE_SQUAT,            /**< Hip -> Knee -> Ankle angle */
    EXERCISE_SHOULDER_PRESS,   /**< Hip -> Shoulder -> Elbow & Elbow -> Wrist */
    EXERCISE_PUSHUP,           /**< Shoulder -> Elbow -> Wrist & Body alignment */
    EXERCISE_PLANK             /**< Isometric core hold & 90° elbow foundation */
} ExerciseType;

/* Biomechanical Rep State Machine Phases */
typedef enum {
    REP_PHASE_START = 0,       /**< Neutral extended starting position */
    REP_PHASE_ECCENTRIC,       /**< Moving towards maximum load/contraction */
    REP_PHASE_INFLECTION,      /**< Apex/trough reached (maximum ROM checked) */
    REP_PHASE_CONCENTRIC,      /**< Return motion towards initial position */
    REP_PHASE_COMPLETED        /**< Rep boundary confirmed & registered */
} RepPhase;

/**
 * @brief Exercise Kinematic Threshold Parameters.
 */
typedef struct {
    double extension_threshold_deg;    /**< Angle representing full extension / rest (e.g., 155°) */
    double contraction_threshold_deg;  /**< Angle representing target inflection (e.g., 50°) */
    double min_rep_duration_sec;       /**< Debounce against rapid twitching (e.g., 0.8s) */
    double max_rep_duration_sec;       /**< Maximum timeout before resetting phase */
    double acceptable_rom_margin_deg;  /**< Tolerance window for partial reps */
} ExerciseConfig;

/**
 * @brief Real-Time Exercise Session & State Machine Context.
 */
typedef struct {
    ExerciseType type;
    char name[32];
    ExerciseConfig config;
    RepPhase current_phase;

    /* Live Telemetry */
    double raw_angle_deg;
    double smoothed_angle_deg;
    double peak_inflection_angle_deg;
    double starting_angle_deg;
    AngleSmoother smoother;

    /* Temporal Tracking */
    double rep_start_time_sec;
    double last_frame_time_sec;
    double current_rep_duration_sec;

    /* Counters & Goals */
    int completed_reps;
    int target_reps;
    int planned_target_reps;

    /* Quality Metrics */
    double live_form_score_pct;
    double live_velocity_deg_per_sec;
    
    /* Demo Pose & Form Accuracy Engine Integration */
    const DemoPose* active_demo_pose;
    FormAccuracyReport last_form_report;
    Point2D last_joint_a;
    Point2D last_joint_b;
    Point2D last_joint_c;

    /* Subsystems integration */
    AlertQueue* alert_queue;
    RepHistoryList* history;
    FatigueInputTelemetry fatigue_telemetry;
    FatigueScalingResult fatigue_scaling;
} ExerciseTracker;

/* --- Exercise Tracker API Prototypes --- */

/**
 * @brief Creates and initializes an exercise state tracking context.
 */
ExerciseTracker* tracker_create(ExerciseType type, int target_reps, AlertQueue* alert_q, RepHistoryList* history);

/**
 * @brief Destroys the tracker context.
 */
void tracker_destroy(ExerciseTracker* tracker);

/**
 * @brief Sets or switches the exercise type and reconfigures biomechanical thresholds.
 */
void tracker_set_exercise(ExerciseTracker* tracker, ExerciseType type);

/**
 * @brief Core Tracking Engine: Ingests 2D Landmark triplet, computes Euclidean angle,
 *        advances FSM state, validates form, updates fatigue, and registers reps.
 * 
 * @param tracker Active session context
 * @param joint_a First keypoint (e.g. Shoulder)
 * @param joint_b Vertex keypoint (e.g. Elbow)
 * @param joint_c Third keypoint (e.g. Wrist)
 * @param current_time_sec Monotonic frame timestamp in seconds
 * @return True if a completed rep was triggered on this frame
 */
bool tracker_process_landmarks(ExerciseTracker* tracker,
                               Point2D joint_a,
                               Point2D joint_b,
                               Point2D joint_c,
                               double current_time_sec);

/**
 * @brief Ingests updated user fatigue parameters and adjusts target reps dynamically.
 */
void tracker_update_fatigue(ExerciseTracker* tracker, const FatigueInputTelemetry* telemetry);

/**
 * @brief Renders an ASCII real-time visual HUD showing angle arc, FSM phase, rep counter.
 */
void tracker_render_hud(const ExerciseTracker* tracker);

#ifdef __cplusplus
}
#endif

#endif /* AURAFIT_EXERCISE_TRACKER_H */
