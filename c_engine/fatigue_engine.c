/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: fatigue_engine.c
 * Description: Dynamic Rule-Based Fatigue Scaling Algorithm Implementation
 * ============================================================================
 */

#include "fatigue_engine.h"
#include <stdio.h>
#include <string.h>
#include <math.h>

void fatigue_evaluate_and_adjust(const FatigueInputTelemetry* inputs,
                                 int current_target_reps,
                                 int completed_reps,
                                 FatigueScalingResult* out_result) {
    if (!out_result) return;
    memset(out_result, 0, sizeof(FatigueScalingResult));

    if (!inputs || current_target_reps <= 0) {
        out_result->adjusted_target_reps = current_target_reps;
        return;
    }

    out_result->original_target_reps = current_target_reps;

    /* Normalize RPE from [1.0 - 10.0] to [0.0 - 100.0] */
    double rpe_normalized = (inputs->perceived_exertion_rpe - 1.0) * (100.0 / 9.0);
    if (rpe_normalized < 0.0) rpe_normalized = 0.0;
    if (rpe_normalized > 100.0) rpe_normalized = 100.0;

    /* Normalize cadence slowdown: ratio > 1.0 indicates slower execution due to fatigue */
    double cadence_penalty = 0.0;
    if (inputs->cadence_slowdown_ratio > 1.0) {
        cadence_penalty = (inputs->cadence_slowdown_ratio - 1.0) * 100.0;
        if (cadence_penalty > 100.0) cadence_penalty = 100.0;
    }

    /*
     * Algorithmic Composite Fatigue Weighting Formula:
     * 35% Mental Fatigue + 25% Physical RPE + 20% Form Breakdown + 10% Cadence Slowdown + 10% Tremor Jitter
     */
    double cfi = (0.35 * inputs->mental_fatigue_pct) +
                 (0.25 * rpe_normalized) +
                 (0.20 * inputs->form_degradation_pct) +
                 (0.10 * cadence_penalty) +
                 (0.10 * inputs->tremor_instability_score);

    if (cfi < 0.0) cfi = 0.0;
    if (cfi > 100.0) cfi = 100.0;
    out_result->composite_fatigue_pct = cfi;

    /* Rule-based Dynamic Rep Scaling Engine */
    int remaining_planned = current_target_reps - completed_reps;
    if (remaining_planned < 0) remaining_planned = 0;

    if (cfi >= 80.0) {
        out_result->zone = FATIGUE_ZONE_EXHAUSTED;
        out_result->rep_reduction_pct = 50.0;
        out_result->recommended_rest_sec = 90;
        out_result->requires_intervention = true;

        int scaled_remaining = (int)round(remaining_planned * 0.50);
        out_result->adjusted_target_reps = completed_reps + scaled_remaining;
        if (out_result->adjusted_target_reps < completed_reps) {
            out_result->adjusted_target_reps = completed_reps;
        }

        snprintf(out_result->recommendation_text, sizeof(out_result->recommendation_text),
                 "CRITICAL FATIGUE (%.1f%%): Target scaled down %d -> %d reps (-50%% remaining). Extended 90s recovery required.",
                 cfi, current_target_reps, out_result->adjusted_target_reps);

    } else if (cfi >= 65.0) {
        out_result->zone = FATIGUE_ZONE_CRITICAL;
        out_result->rep_reduction_pct = 30.0;
        out_result->recommended_rest_sec = 60;
        out_result->requires_intervention = true;

        int scaled_remaining = (int)round(remaining_planned * 0.70);
        out_result->adjusted_target_reps = completed_reps + scaled_remaining;

        snprintf(out_result->recommendation_text, sizeof(out_result->recommendation_text),
                 "ELEVATED FATIGUE (%.1f%%): Mental fatigue threshold crossed. Target adjusted %d -> %d reps (-30%%). Rest 60s.",
                 cfi, current_target_reps, out_result->adjusted_target_reps);

    } else if (cfi >= 45.0) {
        out_result->zone = FATIGUE_ZONE_ELEVATED;
        out_result->rep_reduction_pct = 15.0;
        out_result->recommended_rest_sec = 45;
        out_result->requires_intervention = false;

        int scaled_remaining = (int)round(remaining_planned * 0.85);
        out_result->adjusted_target_reps = completed_reps + scaled_remaining;

        snprintf(out_result->recommendation_text, sizeof(out_result->recommendation_text),
                 "MODERATE EXERTION (%.1f%%): Slight form variance detected. Target trimmed %d -> %d reps. Focus on steady cadence.",
                 cfi, current_target_reps, out_result->adjusted_target_reps);

    } else {
        out_result->zone = FATIGUE_ZONE_OPTIMAL;
        out_result->rep_reduction_pct = 0.0;
        out_result->recommended_rest_sec = 30;
        out_result->requires_intervention = false;
        out_result->adjusted_target_reps = current_target_reps;

        snprintf(out_result->recommendation_text, sizeof(out_result->recommendation_text),
                 "OPTIMAL STAMINA (%.1f%%): Full capacity available. Maintaining nominal target of %d reps.",
                 cfi, current_target_reps);
    }
}
