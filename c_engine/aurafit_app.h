/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: aurafit_app.h
 * Description: Interactive Console UI, Mock Stream Generators & System Controller
 * ============================================================================
 */

#ifndef AURAFIT_APP_H
#define AURAFIT_APP_H

#include "vector_math.h"
#include "spatial_matrix.h"
#include "alert_queue.h"
#include "rep_history.h"
#include "fatigue_engine.h"
#include "exercise_tracker.h"
#include "demo_pose.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Master AuraFit System Controller State.
 */
typedef struct {
    EnvironmentGrid* grid;
    SpatialScanReport last_scan;
    AlertQueue* alert_queue;
    RepHistoryList* history;
    ExerciseTracker* tracker;
    bool is_running;
} AuraFitSystem;

/* --- System Controller API --- */

/**
 * @brief Initializes all subsystems (grid, queue, history, pose tracker).
 */
AuraFitSystem* aurafit_system_init(void);

/**
 * @brief Frees all allocated memory across all subsystems.
 */
void aurafit_system_shutdown(AuraFitSystem* sys);

/**
 * @brief Starts the main interactive console menu loop.
 */
void aurafit_run_interactive_menu(AuraFitSystem* sys);

/**
 * @brief Runs an animated real-time mock landmark workout session.
 */
void aurafit_run_live_simulation(AuraFitSystem* sys, ExerciseType ex_type, int rep_goal, bool simulate_fatigue);

/**
 * @brief Runs interactive spatial matrix environment scan and visualization.
 */
void aurafit_run_spatial_scanner_demo(AuraFitSystem* sys);

/**
 * @brief Runs interactive 3-point joint coordinate vector math calculator.
 */
void aurafit_run_vector_math_lab(void);

/**
 * @brief Runs dynamic fatigue adjuster scaling simulation.
 */
void aurafit_run_fatigue_scaling_demo(AuraFitSystem* sys);

/**
 * @brief Runs interactive Demo Pose Benchmark & Form Accuracy Comparison Lab.
 */
void aurafit_run_demo_pose_comparison_lab(void);

/**
 * @brief Runs the complete automated algorithmic unit test suite.
 */
void aurafit_run_automated_tests(void);

#ifdef __cplusplus
}
#endif

#endif /* AURAFIT_APP_H */
