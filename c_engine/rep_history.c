/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: rep_history.c
 * Description: Dynamic Resizing Array Implementation & Statistical Analytics
 * ============================================================================
 */

#include "rep_history.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define INITIAL_DEFAULT_CAPACITY 16
#define GROWTH_FACTOR 2

RepHistoryList* rep_history_create(size_t initial_capacity) {
    if (initial_capacity == 0) initial_capacity = INITIAL_DEFAULT_CAPACITY;

    RepHistoryList* history = (RepHistoryList*)malloc(sizeof(RepHistoryList));
    if (!history) return NULL;

    history->entries = (RepLogEntry*)calloc(initial_capacity, sizeof(RepLogEntry));
    if (!history->entries) {
        free(history);
        return NULL;
    }

    history->count = 0;
    history->capacity = initial_capacity;
    return history;
}

void rep_history_destroy(RepHistoryList* history) {
    if (history) {
        if (history->entries) {
            free(history->entries);
            history->entries = NULL;
        }
        free(history);
    }
}

bool rep_history_append(RepHistoryList* history, const RepLogEntry* entry) {
    if (!history || !entry) return false;

    /* Expand array dynamically if capacity exceeded */
    if (history->count >= history->capacity) {
        size_t new_capacity = history->capacity * GROWTH_FACTOR;
        RepLogEntry* new_entries = (RepLogEntry*)realloc(history->entries, new_capacity * sizeof(RepLogEntry));
        if (!new_entries) {
            return false; /* Allocation failure */
        }
        history->entries = new_entries;
        history->capacity = new_capacity;
    }

    history->entries[history->count] = *entry;
    history->count++;
    return true;
}

const RepLogEntry* rep_history_get(const RepHistoryList* history, size_t index) {
    if (!history || index >= history->count) return NULL;
    return &history->entries[index];
}

void rep_history_clear(RepHistoryList* history) {
    if (history) {
        history->count = 0;
    }
}

void rep_history_compute_stats(const RepHistoryList* history, WorkoutSummaryStats* stats) {
    if (!stats) return;
    memset(stats, 0, sizeof(WorkoutSummaryStats));
    if (!history || history->count == 0) return;

    stats->total_reps = (int)history->count;
    double sum_duration = 0.0;
    double sum_form = 0.0;
    double sum_fatigue = 0.0;
    stats->max_fatigue_pct = 0.0;

    for (size_t i = 0; i < history->count; ++i) {
        const RepLogEntry* e = &history->entries[i];
        sum_duration += e->duration_seconds;
        sum_form += e->form_score_pct;
        sum_fatigue += e->fatigue_at_rep_pct;

        if (e->fatigue_at_rep_pct > stats->max_fatigue_pct) {
            stats->max_fatigue_pct = e->fatigue_at_rep_pct;
        }

        if (e->rating == FORM_PERFECT) {
            stats->perfect_reps++;
        } else if (e->rating == FORM_PARTIAL_ROM) {
            stats->partial_reps++;
        }
    }

    stats->total_active_time_sec = sum_duration;
    stats->avg_duration_sec = sum_duration / history->count;
    stats->avg_form_score_pct = sum_form / history->count;
    stats->avg_fatigue_pct = sum_fatigue / history->count;

    /* Consistency score: ratio of high form reps and cadence stability */
    double form_ratio = (double)stats->perfect_reps / (double)history->count;
    stats->consistency_score_pct = (form_ratio * 70.0) + ((stats->avg_form_score_pct / 100.0) * 30.0);
    if (stats->consistency_score_pct > 100.0) stats->consistency_score_pct = 100.0;
}

void rep_history_print_report(const RepHistoryList* history) {
    if (!history || history->count == 0) {
        printf("  [Workout History Log]: (No completed reps recorded yet)\n");
        return;
    }

    WorkoutSummaryStats stats;
    rep_history_compute_stats(history, &stats);

    printf("\n  +=============================================================================+\n");
    printf("  |                   AURAFIT WORKOUT ANALYTICS & REP LOG                     |\n");
    printf("  +=============================================================================+\n");
    printf("  | Rep | Exercise      | Duration | Contraction | Extension | Form %% | Fatigue | Rating    |\n");
    printf("  +-----+---------------+----------+-------------+-----------+--------+---------+-----------+\n");

    for (size_t i = 0; i < history->count; ++i) {
        const RepLogEntry* e = &history->entries[i];
        const char* rate_str = "PERFECT";
        switch (e->rating) {
            case FORM_PERFECT:     rate_str = "PERFECT  "; break;
            case FORM_GOOD:        rate_str = "GOOD     "; break;
            case FORM_PARTIAL_ROM: rate_str = "PARTIAL  "; break;
            case FORM_ERRATIC:     rate_str = "ERRATIC  "; break;
        }

        printf("  | #%02d | %-13s | %5.2fs   |   %5.1f*    |  %5.1f*   | %5.1f%% |  %5.1f%% | %s |\n",
               e->rep_number, e->exercise_name, e->duration_seconds,
               e->inflection_angle_deg, e->extension_angle_deg,
               e->form_score_pct, e->fatigue_at_rep_pct, rate_str);
    }

    printf("  +-----------------------------------------------------------------------------+\n");
    printf("  | Aggregate Performance Metrics:                                              |\n");
    printf("  |  * Total Completed Reps : %-3d (Perfect: %d, Partial: %d)                   |\n",
           stats.total_reps, stats.perfect_reps, stats.partial_reps);
    printf("  |  * Total Active Time    : %.2f sec (Average: %.2fs per rep)                 |\n",
           stats.total_active_time_sec, stats.avg_duration_sec);
    printf("  |  * Average Form Score   : %.1f%%  | Consistency Index: %.1f%%                 |\n",
           stats.avg_form_score_pct, stats.consistency_score_pct);
    printf("  |  * Average Fatigue Level: %.1f%%  | Peak Fatigue Exertion: %.1f%%             |\n",
           stats.avg_fatigue_pct, stats.max_fatigue_pct);
    printf("  +=============================================================================+\n\n");
}
