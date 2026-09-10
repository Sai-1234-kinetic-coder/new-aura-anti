/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: rep_history.h
 * Description: Dynamic Array & Linked List Log Structure for Completed Reps
 * ============================================================================
 */

#ifndef AURAFIT_REP_HISTORY_H
#define AURAFIT_REP_HISTORY_H

#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Qualitative Classification of Completed Repetition */
typedef enum {
    FORM_PERFECT = 0,    /**< Full range of motion, stable velocity */
    FORM_GOOD,           /**< Minor deviation, good tempo */
    FORM_PARTIAL_ROM,    /**< Incomplete contraction or extension */
    FORM_ERRATIC         /**< Jerky motion or excessive joint flare */
} RepFormRating;

/**
 * @brief Individual Repetition Telemetry Log Entry.
 */
typedef struct {
    int rep_number;
    char exercise_name[32];
    double duration_seconds;
    double inflection_angle_deg; /**< Peak contraction / deepest squat angle */
    double extension_angle_deg;  /**< Starting / full extension angle */
    double form_score_pct;       /**< Form quality [0.0 - 100.0] */
    double fatigue_at_rep_pct;   /**< Measured fatigue index at time of rep */
    RepFormRating rating;
    unsigned long timestamp_sec;
} RepLogEntry;

/**
 * @brief Dynamic Resizing Array Structure for High-Performance Rep Logging.
 */
typedef struct {
    RepLogEntry* entries;
    size_t count;
    size_t capacity;
} RepHistoryList;

/**
 * @brief Aggregate Workout Analytics Summary.
 */
typedef struct {
    int total_reps;
    int perfect_reps;
    int partial_reps;
    double avg_duration_sec;
    double avg_form_score_pct;
    double avg_fatigue_pct;
    double max_fatigue_pct;
    double consistency_score_pct;
    double total_active_time_sec;
} WorkoutSummaryStats;

/* --- Rep History API Prototypes --- */

/**
 * @brief Allocates and initializes a dynamic rep history log.
 */
RepHistoryList* rep_history_create(size_t initial_capacity);

/**
 * @brief Destroys and frees all memory allocated for rep history.
 */
void rep_history_destroy(RepHistoryList* history);

/**
 * @brief Appends a completed repetition record with automatic geometric reallocation.
 */
bool rep_history_append(RepHistoryList* history, const RepLogEntry* entry);

/**
 * @brief Retrieves a pointer to a rep entry by index.
 */
const RepLogEntry* rep_history_get(const RepHistoryList* history, size_t index);

/**
 * @brief Clears all entries from the history without freeing the container.
 */
void rep_history_clear(RepHistoryList* history);

/**
 * @brief Calculates overall aggregate workout statistics across all logged reps.
 */
void rep_history_compute_stats(const RepHistoryList* history, WorkoutSummaryStats* stats);

/**
 * @brief Formats and prints a detailed tabular report of all completed reps and stats.
 */
void rep_history_print_report(const RepHistoryList* history);

#ifdef __cplusplus
}
#endif

#endif /* AURAFIT_REP_HISTORY_H */
