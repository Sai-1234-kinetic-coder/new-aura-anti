/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: fatigue_engine.h
 * Description: Rule-Based Dynamic Fatigue Assessment & Target Rep Adjuster
 * ============================================================================
 */

#ifndef AURAFIT_FATIGUE_ENGINE_H
#define AURAFIT_FATIGUE_ENGINE_H

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Fatigue Threshold Severity */
typedef enum {
    FATIGUE_ZONE_OPTIMAL = 0,   /**< < 40% exertion: full performance capacity */
    FATIGUE_ZONE_ELEVATED,      /**< 40% - 64%: mild pacing compensation required */
    FATIGUE_ZONE_CRITICAL,      /**< 65% - 79%: high injury risk, target rep reduction */
    FATIGUE_ZONE_EXHAUSTED      /**< >= 80%: severe cognitive & motor breakdown */
} FatigueZone;

/**
 * @brief Input Telemetry for Dynamic Fatigue Assessment.
 */
typedef struct {
    double mental_fatigue_pct;       /**< User mental/cognitive fatigue [0.0 - 100.0] */
    double perceived_exertion_rpe;   /**< Rate of Perceived Exertion [1.0 - 10.0] */
    double form_degradation_pct;     /**< Loss in ROM/form precision [0.0 - 100.0] */
    double cadence_slowdown_ratio;   /**< Current rep duration / Baseline duration */
    double tremor_instability_score; /**< High-frequency joint jitter [0.0 - 100.0] */
} FatigueInputTelemetry;

/**
 * @brief Output of Fatigue Adjuster Engine with Scaled Recommendations.
 */
typedef struct {
    double composite_fatigue_pct;    /**< Weighted composite fatigue [0.0 - 100.0] */
    FatigueZone zone;
    int original_target_reps;
    int adjusted_target_reps;
    double rep_reduction_pct;
    int recommended_rest_sec;
    bool requires_intervention;
    char recommendation_text[160];
} FatigueScalingResult;

/* --- Fatigue Engine API Prototypes --- */

/**
 * @brief Computes Composite Fatigue Index and executes dynamic rule-based target rep scaling.
 * 
 * @param inputs Telemetry readings (mental fatigue, RPE, form degradation, cadence)
 * @param current_target_reps Planned target reps for active set
 * @param completed_reps Reps completed so far
 * @param out_result Pointer to receive scaling decisions and advisories
 */
void fatigue_evaluate_and_adjust(const FatigueInputTelemetry* inputs,
                                 int current_target_reps,
                                 int completed_reps,
                                 FatigueScalingResult* out_result);

#ifdef __cplusplus
}
#endif

#endif /* AURAFIT_FATIGUE_ENGINE_H */
