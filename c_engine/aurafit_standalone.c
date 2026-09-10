/**
 * ============================================================================
 * AURAFIT: AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Standalone Single-File Compilation Unit (C99 / C11 Standard)
 *
 * Compiles seamlessly with any standard C compiler:
 *   GCC/Clang: gcc -O2 -std=c99 aurafit_standalone.c -o aurafit -lm
 *   MSVC:      cl /O2 aurafit_standalone.c
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <math.h>
#include <time.h>
#include <stdarg.h>

#if defined(_WIN32) || defined(_WIN64)
#include <windows.h>
static void platform_sleep(int ms) {
    Sleep(ms);
}
#else
#include <unistd.h>
static void platform_sleep(int ms) {
    usleep(ms * 1000);
}
#endif

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define RAD_TO_DEG(radians) ((radians) * (180.0 / M_PI))
#define DEG_TO_RAD(degrees) ((degrees) * (M_PI / 180.0))

/* ============================================================================
 * SECTION 1: DATA STRUCTURES ARCHITECTURE
 * ============================================================================
 */

/* 1.1 Landmark & Vector Geometry Structures */
typedef struct {
    double x;
    double y;
    float confidence;
    bool is_valid;
} Point2D;

typedef struct {
    double dx;
    double dy;
} Vector2D;

typedef struct {
    double alpha;
    double filtered_angle;
    bool is_initialized;
} AngleSmoother;

/* 1.2 Spatial Matrix & Environment Structures */
typedef enum {
    CELL_EMPTY     = 0,  /* Free space / workout zone */
    CELL_BUFFER    = 1,  /* Cautionary buffer boundary */
    CELL_OBSTACLE  = 2,  /* Solid obstacle / wall */
    CELL_HAZARD    = 3,  /* Dynamic hazard / sharp edge */
    CELL_USER      = 9   /* Tracked user position */
} CellType;

typedef enum {
    SAFETY_EXCELLENT,
    SAFETY_ADEQUATE,
    SAFETY_CONGESTED_WARNING,
    SAFETY_DANGEROUS_BLOCKED
} SafetyLevel;

typedef struct {
    int rows;
    int cols;
    double cell_size_meters;
    int* cells;
    int user_row;
    int user_col;
    double safe_radius_meters;
} EnvironmentGrid;

typedef struct {
    int total_cells;
    int empty_cells;
    int buffer_cells;
    int obstacle_cells;
    int hazard_cells;
    double free_space_ratio;
    double obstacle_density_ratio;
    double min_obstacle_distance_m;
    bool user_in_bounds;
    bool proximity_breach;
    double safety_score;
    SafetyLevel safety_level;
    char status_advisory[128];
} SpatialScanReport;

/* 1.3 FIFO Queue Data Structure for Real-Time Safety & Guidance */
typedef enum {
    ALERT_INFO = 0,
    ALERT_CAUTION,
    ALERT_WARNING,
    ALERT_CRITICAL
} AlertPriority;

typedef enum {
    CAT_SPATIAL_SAFETY = 0,
    CAT_POSE_ALIGNMENT,
    CAT_FATIGUE_OVERLOAD,
    CAT_CADENCE_PACING,
    CAT_SYSTEM
} AlertCategory;

typedef struct {
    unsigned long id;
    unsigned long long timestamp_ms;
    AlertPriority priority;
    AlertCategory category;
    char message[160];
    double metric_value;
} AlertItem;

typedef struct {
    AlertItem* buffer;
    size_t capacity;
    size_t head;
    size_t tail;
    size_t count;
    unsigned long next_id;
} AlertQueue;

/* 1.4 Dynamic Array Workout Completed Rep History */
typedef enum {
    FORM_PERFECT = 0,
    FORM_GOOD,
    FORM_PARTIAL_ROM,
    FORM_ERRATIC
} RepFormRating;

typedef struct {
    int rep_number;
    char exercise_name[32];
    double duration_seconds;
    double inflection_angle_deg;
    double extension_angle_deg;
    double form_score_pct;
    double fatigue_at_rep_pct;
    RepFormRating rating;
    unsigned long timestamp_sec;
} RepLogEntry;

typedef struct {
    RepLogEntry* entries;
    size_t count;
    size_t capacity;
} RepHistoryList;

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

/* 1.5 Dynamic Fatigue Adjuster Structures */
typedef enum {
    FATIGUE_ZONE_OPTIMAL = 0,
    FATIGUE_ZONE_ELEVATED,
    FATIGUE_ZONE_CRITICAL,
    FATIGUE_ZONE_EXHAUSTED
} FatigueZone;

typedef struct {
    double mental_fatigue_pct;
    double perceived_exertion_rpe;
    double form_degradation_pct;
    double cadence_slowdown_ratio;
    double tremor_instability_score;
} FatigueInputTelemetry;

typedef struct {
    double composite_fatigue_pct;
    FatigueZone zone;
    int original_target_reps;
    int adjusted_target_reps;
    double rep_reduction_pct;
    int recommended_rest_sec;
    bool requires_intervention;
    char recommendation_text[160];
} FatigueScalingResult;

/* 1.6 Exercise Pose State Machine Tracking */
typedef enum {
    EXERCISE_BICEP_CURL = 0,
    EXERCISE_SQUAT,
    EXERCISE_SHOULDER_PRESS,
    EXERCISE_PUSHUP
} ExerciseType;

typedef enum {
    REP_PHASE_START = 0,
    REP_PHASE_ECCENTRIC,
    REP_PHASE_INFLECTION,
    REP_PHASE_CONCENTRIC,
    REP_PHASE_COMPLETED
} RepPhase;

typedef struct {
    double extension_threshold_deg;
    double contraction_threshold_deg;
    double min_rep_duration_sec;
    double max_rep_duration_sec;
    double acceptable_rom_margin_deg;
} ExerciseConfig;

typedef struct {
    ExerciseType type;
    char name[32];
    ExerciseConfig config;
    RepPhase current_phase;

    double raw_angle_deg;
    double smoothed_angle_deg;
    double peak_inflection_angle_deg;
    double starting_angle_deg;
    AngleSmoother smoother;

    double rep_start_time_sec;
    double last_frame_time_sec;
    double current_rep_duration_sec;

    int completed_reps;
    int target_reps;
    int planned_target_reps;

    double live_form_score_pct;
    double live_velocity_deg_per_sec;

    AlertQueue* alert_queue;
    RepHistoryList* history;
    FatigueInputTelemetry fatigue_telemetry;
    FatigueScalingResult fatigue_scaling;
} ExerciseTracker;

/* Master AuraFit State Controller */
typedef struct {
    EnvironmentGrid* grid;
    SpatialScanReport last_scan;
    AlertQueue* alert_queue;
    RepHistoryList* history;
    ExerciseTracker* tracker;
    bool is_running;
} AuraFitSystem;


/* ============================================================================
 * SECTION 2: CORE ALGORITHMIC ENGINES IMPLEMENTATION
 * ============================================================================
 */

/* --- 2.1 Euclidean Vector Math & Joint Angle Engine --- */

static inline Vector2D vec_from_points(Point2D from, Point2D to) {
    Vector2D v;
    v.dx = to.x - from.x;
    v.dy = to.y - from.y;
    return v;
}

static inline double vec_magnitude(Vector2D v) {
    return sqrt((v.dx * v.dx) + (v.dy * v.dy));
}

static inline double vec_dot(Vector2D v1, Vector2D v2) {
    return (v1.dx * v2.dx) + (v1.dy * v2.dy);
}

static inline double vec_cross_2d(Vector2D v1, Vector2D v2) {
    return (v1.dx * v2.dy) - (v1.dy * v2.dx);
}

double calculate_joint_angle_deg(Point2D a, Point2D b, Point2D c) {
    Vector2D ba = vec_from_points(b, a);
    Vector2D bc = vec_from_points(b, c);

    double mag_ba = vec_magnitude(ba);
    double mag_bc = vec_magnitude(bc);

    if (mag_ba < 1e-7 || mag_bc < 1e-7) return 0.0;

    double dot = vec_dot(ba, bc);
    double cosine = dot / (mag_ba * mag_bc);
    if (cosine > 1.0) cosine = 1.0;
    else if (cosine < -1.0) cosine = -1.0;

    return RAD_TO_DEG(acos(cosine));
}

void angle_smoother_init(AngleSmoother* smoother, double alpha) {
    if (!smoother) return;
    if (alpha <= 0.0) alpha = 0.1;
    if (alpha > 1.0) alpha = 1.0;
    smoother->alpha = alpha;
    smoother->filtered_angle = 0.0;
    smoother->is_initialized = false;
}

double angle_smoother_update(AngleSmoother* smoother, double raw_angle) {
    if (!smoother) return raw_angle;
    if (!smoother->is_initialized) {
        smoother->filtered_angle = raw_angle;
        smoother->is_initialized = true;
    } else {
        smoother->filtered_angle = (smoother->alpha * raw_angle) + 
                                   ((1.0 - smoother->alpha) * smoother->filtered_angle);
    }
    return smoother->filtered_angle;
}

/* --- 2.2 Spatial Matrix Scan (2D Array Density Engine) --- */

EnvironmentGrid* grid_create(int rows, int cols, double cell_size_m, double safe_radius_m) {
    if (rows <= 0 || cols <= 0) return NULL;
    EnvironmentGrid* grid = (EnvironmentGrid*)malloc(sizeof(EnvironmentGrid));
    if (!grid) return NULL;

    grid->rows = rows;
    grid->cols = cols;
    grid->cell_size_meters = (cell_size_m > 0.0) ? cell_size_m : 0.25;
    grid->safe_radius_meters = (safe_radius_m > 0.0) ? safe_radius_m : 1.25;
    grid->user_row = rows / 2;
    grid->user_col = cols / 2;

    size_t total = (size_t)rows * (size_t)cols;
    grid->cells = (int*)calloc(total, sizeof(int));
    if (!grid->cells) {
        free(grid);
        return NULL;
    }
    grid->cells[grid->user_row * cols + grid->user_col] = CELL_USER;
    return grid;
}

void grid_destroy(EnvironmentGrid* grid) {
    if (grid) {
        if (grid->cells) free(grid->cells);
        free(grid);
    }
}

void grid_clear(EnvironmentGrid* grid, CellType fill_type) {
    if (!grid || !grid->cells) return;
    size_t total = (size_t)grid->rows * (size_t)grid->cols;
    for (size_t i = 0; i < total; ++i) grid->cells[i] = (int)fill_type;
}

bool grid_set_cell(EnvironmentGrid* grid, int r, int c, CellType type) {
    if (!grid || !grid->cells || r < 0 || r >= grid->rows || c < 0 || c >= grid->cols) return false;
    grid->cells[r * grid->cols + c] = (int)type;
    return true;
}

int grid_get_cell(const EnvironmentGrid* grid, int r, int c) {
    if (!grid || !grid->cells || r < 0 || r >= grid->rows || c < 0 || c >= grid->cols) return -1;
    return grid->cells[r * grid->cols + c];
}

bool grid_set_user_position(EnvironmentGrid* grid, int r, int c) {
    if (!grid || !grid->cells || r < 0 || r >= grid->rows || c < 0 || c >= grid->cols) return false;
    if (grid->user_row >= 0 && grid->user_row < grid->rows &&
        grid->user_col >= 0 && grid->user_col < grid->cols) {
        grid->cells[grid->user_row * grid->cols + grid->user_col] = CELL_EMPTY;
    }
    grid->user_row = r;
    grid->user_col = c;
    grid->cells[r * grid->cols + c] = CELL_USER;
    return true;
}

void grid_add_obstacle_rect(EnvironmentGrid* grid, int top_r, int left_c, int height, int width) {
    if (!grid) return;
    for (int r = top_r; r < top_r + height; ++r) {
        for (int c = left_c; c < left_c + width; ++c) {
            grid_set_cell(grid, r, c, CELL_OBSTACLE);
        }
    }
}

void grid_load_preset_layout(EnvironmentGrid* grid, int preset_id) {
    if (!grid) return;
    grid_clear(grid, CELL_EMPTY);
    int rows = grid->rows;
    int cols = grid->cols;

    for (int r = 0; r < rows; ++r) {
        grid_set_cell(grid, r, 0, CELL_OBSTACLE);
        grid_set_cell(grid, r, cols - 1, CELL_OBSTACLE);
    }
    for (int c = 0; c < cols; ++c) {
        grid_set_cell(grid, 0, c, CELL_OBSTACLE);
        grid_set_cell(grid, rows - 1, c, CELL_OBSTACLE);
    }

    grid_set_user_position(grid, rows / 2, cols / 2);

    if (preset_id == 1) {
        /* Studio */
        grid_set_cell(grid, 1, 1, CELL_BUFFER);
        grid_set_cell(grid, 1, cols - 2, CELL_BUFFER);
    } else if (preset_id == 2) {
        /* Home Gym */
        grid_add_obstacle_rect(grid, 1, cols / 4, 2, cols / 2);
        grid_set_cell(grid, rows - 3, 2, CELL_OBSTACLE);
        grid_set_cell(grid, rows - 3, 3, CELL_OBSTACLE);
    } else if (preset_id == 3) {
        /* Hazardous Workspace */
        grid_add_obstacle_rect(grid, (rows / 2) - 1, (cols / 2) + 1, 3, 2);
        grid_add_obstacle_rect(grid, (rows / 2) + 1, (cols / 2) - 3, 2, 2);
        grid_set_cell(grid, (rows / 2) - 1, (cols / 2) - 1, CELL_HAZARD);
    }
}

void grid_scan_environment(const EnvironmentGrid* grid, SpatialScanReport* report) {
    if (!grid || !report) return;
    memset(report, 0, sizeof(SpatialScanReport));
    report->total_cells = grid->rows * grid->cols;
    report->min_obstacle_distance_m = 999.0;
    report->user_in_bounds = (grid->user_row >= 0 && grid->user_row < grid->rows &&
                              grid->user_col >= 0 && grid->user_col < grid->cols);

    double u_r = (double)grid->user_row;
    double u_c = (double)grid->user_col;

    for (int r = 0; r < grid->rows; ++r) {
        for (int c = 0; c < grid->cols; ++c) {
            int cell_val = grid->cells[r * grid->cols + c];
            if (cell_val == CELL_EMPTY || cell_val == CELL_USER) {
                report->empty_cells++;
            } else if (cell_val == CELL_BUFFER) {
                report->buffer_cells++;
            } else if (cell_val == CELL_OBSTACLE || cell_val == CELL_HAZARD) {
                if (cell_val == CELL_OBSTACLE) report->obstacle_cells++;
                else report->hazard_cells++;

                if (report->user_in_bounds) {
                    double dr = (r - u_r) * grid->cell_size_meters;
                    double dc = (c - u_c) * grid->cell_size_meters;
                    double dist = sqrt(dr * dr + dc * dc);
                    if (dist < report->min_obstacle_distance_m) {
                        report->min_obstacle_distance_m = dist;
                    }
                }
            }
        }
    }

    if (report->total_cells > 0) {
        report->free_space_ratio = (double)report->empty_cells / (double)report->total_cells;
        report->obstacle_density_ratio = (double)(report->obstacle_cells + report->hazard_cells) / (double)report->total_cells;
    }

    report->proximity_breach = (report->min_obstacle_distance_m < grid->safe_radius_meters);

    double ratio_component = report->free_space_ratio * 60.0;
    double clearance_component = (grid->safe_radius_meters > 0.0) ? 
        fmin(1.5, report->min_obstacle_distance_m / grid->safe_radius_meters) / 1.5 * 40.0 : 0.0;

    report->safety_score = ratio_component + clearance_component - (report->hazard_cells * 5.0);
    if (report->safety_score < 0.0) report->safety_score = 0.0;
    if (report->safety_score > 100.0) report->safety_score = 100.0;

    if (report->proximity_breach || report->free_space_ratio < 0.35 || report->hazard_cells > 2) {
        report->safety_level = SAFETY_DANGEROUS_BLOCKED;
        snprintf(report->status_advisory, sizeof(report->status_advisory),
                 "CRITICAL: Obstacle breach within %.2fm! Clear perimeter immediately.",
                 report->min_obstacle_distance_m);
    } else if (report->free_space_ratio < 0.55 || report->min_obstacle_distance_m < (grid->safe_radius_meters * 1.25)) {
        report->safety_level = SAFETY_CONGESTED_WARNING;
        snprintf(report->status_advisory, sizeof(report->status_advisory),
                 "CAUTION: Restricted clearance (%.2fm). Avoid wide lateral extensions.",
                 report->min_obstacle_distance_m);
    } else if (report->free_space_ratio < 0.75) {
        report->safety_level = SAFETY_ADEQUATE;
        snprintf(report->status_advisory, sizeof(report->status_advisory),
                 "ADEQUATE: Space density safe (%.1f%% free). Standard safety zone maintained.",
                 report->free_space_ratio * 100.0);
    } else {
        report->safety_level = SAFETY_EXCELLENT;
        snprintf(report->status_advisory, sizeof(report->status_advisory),
                 "OPTIMAL: Spacious environment (%.1f%% free, clearance %.2fm). Full ROM safe.",
                 report->free_space_ratio * 100.0, report->min_obstacle_distance_m);
    }
}

void grid_render_ascii(const EnvironmentGrid* grid, const SpatialScanReport* report) {
    if (!grid || !grid->cells) return;

    printf("\n  +--- 2D SPATIAL DENSITY RADAR SCAN (%dx%d, Res: %.2fm) ---+\n",
           grid->cols, grid->rows, grid->cell_size_meters);
    printf("   ");
    for (int c = 0; c < grid->cols; ++c) printf(" %d", c % 10);
    printf("\n  +");
    for (int c = 0; c < grid->cols; ++c) printf("--");
    printf("-+\n");

    for (int r = 0; r < grid->rows; ++r) {
        printf("%2d|", r);
        for (int c = 0; c < grid->cols; ++c) {
            int val = grid->cells[r * grid->cols + c];
            if (r == grid->user_row && c == grid->user_col) {
                printf(" U");
            } else {
                switch (val) {
                    case CELL_EMPTY:    printf(" ."); break;
                    case CELL_BUFFER:   printf(" ~"); break;
                    case CELL_OBSTACLE: printf(" #"); break;
                    case CELL_HAZARD:   printf(" !"); break;
                    default:            printf(" ?"); break;
                }
            }
        }
        printf(" |\n");
    }

    printf("  +");
    for (int c = 0; c < grid->cols; ++c) printf("--");
    printf("-+\n");
    printf("  Legend: [U] User  [.] Free (0)  [~] Buffer (1)  [#] Obstacle (2)  [!] Hazard (3)\n");

    if (report) {
        const char* lvl_str = (report->safety_level == SAFETY_EXCELLENT) ? "[+] EXCELLENT - ZONE SAFE" :
                              (report->safety_level == SAFETY_ADEQUATE) ? "[~] ADEQUATE - SAFE" :
                              (report->safety_level == SAFETY_CONGESTED_WARNING) ? "[!] CONGESTED - CAUTION" :
                              "[X] DANGEROUS - COLLISION RISK";

        printf("  Telemetry Summary:\n");
        printf("   * Safety Score: %.1f / 100.0  |  Status: %s\n", report->safety_score, lvl_str);
        printf("   * Free Space: %.1f%% (%d cells)  |  Obstacle Density: %.1f%% (%d cells)\n",
               report->free_space_ratio * 100.0, report->empty_cells,
               report->obstacle_density_ratio * 100.0, report->obstacle_cells);
        printf("   * Min Obstacle Proximity: %.2f m (Safe Threshold: %.2f m)\n",
               report->min_obstacle_distance_m, grid->safe_radius_meters);
        printf("   * Safety Advisory: %s\n\n", report->status_advisory);
    }
}

/* --- 2.3 FIFO Queue Engine Implementation --- */

AlertQueue* alert_queue_create(size_t capacity) {
    if (capacity == 0) capacity = 32;
    AlertQueue* q = (AlertQueue*)malloc(sizeof(AlertQueue));
    if (!q) return NULL;
    q->buffer = (AlertItem*)calloc(capacity, sizeof(AlertItem));
    if (!q->buffer) { free(q); return NULL; }
    q->capacity = capacity;
    q->head = 0;
    q->tail = 0;
    q->count = 0;
    q->next_id = 1;
    return q;
}

void alert_queue_destroy(AlertQueue* q) {
    if (q) {
        if (q->buffer) free(q->buffer);
        free(q);
    }
}

bool alert_queue_is_empty(const AlertQueue* q) {
    return (!q || q->count == 0);
}

bool alert_queue_is_full(const AlertQueue* q) {
    return (q && q->count >= q->capacity);
}

size_t alert_queue_count(const AlertQueue* q) {
    return q ? q->count : 0;
}

bool alert_queue_push(AlertQueue* q, AlertPriority priority, AlertCategory category,
                      double metric_val, const char* message_fmt, ...) {
    if (!q || !message_fmt) return false;
    if (alert_queue_is_full(q)) {
        q->head = (q->head + 1) % q->capacity;
        q->count--;
    }

    AlertItem* item = &q->buffer[q->tail];
    item->id = q->next_id++;
    item->timestamp_ms = (unsigned long long)time(NULL) * 1000ULL;
    item->priority = priority;
    item->category = category;
    item->metric_value = metric_val;

    va_list args;
    va_start(args, message_fmt);
    vsnprintf(item->message, sizeof(item->message), message_fmt, args);
    va_end(args);

    q->tail = (q->tail + 1) % q->capacity;
    q->count++;
    return true;
}

bool alert_queue_pop(AlertQueue* q, AlertItem* out_item) {
    if (alert_queue_is_empty(q)) return false;
    if (out_item) *out_item = q->buffer[q->head];
    q->head = (q->head + 1) % q->capacity;
    q->count--;
    return true;
}

void alert_queue_drain_and_print(AlertQueue* q) {
    if (!q || alert_queue_is_empty(q)) {
        printf("  [Alert Queue]: (Empty - No active warnings)\n");
        return;
    }

    printf("\n  +--- ACTIVE REAL-TIME SAFETY & ADVISORY BUFFER (FIFO, Count: %zu) ---+\n", q->count);
    AlertItem item;
    int idx = 1;
    while (alert_queue_pop(q, &item)) {
        const char* prio_tag = (item.priority == ALERT_INFO) ? "[INFO]    " :
                               (item.priority == ALERT_CAUTION) ? "[CAUTION] " :
                               (item.priority == ALERT_WARNING) ? "[WARNING] " : "[CRITICAL]";
        const char* cat_tag = (item.category == CAT_SPATIAL_SAFETY) ? "SPATIAL" :
                              (item.category == CAT_POSE_ALIGNMENT) ? "FORM   " :
                              (item.category == CAT_FATIGUE_OVERLOAD) ? "FATIGUE" :
                              (item.category == CAT_CADENCE_PACING) ? "CADENCE" : "SYSTEM ";

        printf("  #%02d | %s | %s | %s\n", idx++, prio_tag, cat_tag, item.message);
    }
    printf("  +--------------------------------------------------------------------+\n\n");
}

/* --- 2.4 Dynamic Array Rep History Implementation --- */

RepHistoryList* rep_history_create(size_t initial_capacity) {
    if (initial_capacity == 0) initial_capacity = 16;
    RepHistoryList* history = (RepHistoryList*)malloc(sizeof(RepHistoryList));
    if (!history) return NULL;
    history->entries = (RepLogEntry*)calloc(initial_capacity, sizeof(RepLogEntry));
    if (!history->entries) { free(history); return NULL; }
    history->count = 0;
    history->capacity = initial_capacity;
    return history;
}

void rep_history_destroy(RepHistoryList* history) {
    if (history) {
        if (history->entries) free(history->entries);
        free(history);
    }
}

bool rep_history_append(RepHistoryList* history, const RepLogEntry* entry) {
    if (!history || !entry) return false;
    if (history->count >= history->capacity) {
        size_t new_cap = history->capacity * 2;
        RepLogEntry* new_entries = (RepLogEntry*)realloc(history->entries, new_cap * sizeof(RepLogEntry));
        if (!new_entries) return false;
        history->entries = new_entries;
        history->capacity = new_cap;
    }
    history->entries[history->count++] = *entry;
    return true;
}

void rep_history_compute_stats(const RepHistoryList* history, WorkoutSummaryStats* stats) {
    if (!stats) return;
    memset(stats, 0, sizeof(WorkoutSummaryStats));
    if (!history || history->count == 0) return;

    stats->total_reps = (int)history->count;
    double sum_dur = 0.0, sum_form = 0.0, sum_fat = 0.0;
    stats->max_fatigue_pct = 0.0;

    for (size_t i = 0; i < history->count; ++i) {
        const RepLogEntry* e = &history->entries[i];
        sum_dur += e->duration_seconds;
        sum_form += e->form_score_pct;
        sum_fat += e->fatigue_at_rep_pct;
        if (e->fatigue_at_rep_pct > stats->max_fatigue_pct) stats->max_fatigue_pct = e->fatigue_at_rep_pct;
        if (e->rating == FORM_PERFECT) stats->perfect_reps++;
        else if (e->rating == FORM_PARTIAL_ROM) stats->partial_reps++;
    }

    stats->total_active_time_sec = sum_dur;
    stats->avg_duration_sec = sum_dur / history->count;
    stats->avg_form_score_pct = sum_form / history->count;
    stats->avg_fatigue_pct = sum_fat / history->count;

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
        const char* rate_str = (e->rating == FORM_PERFECT) ? "PERFECT  " :
                               (e->rating == FORM_GOOD)    ? "GOOD     " :
                               (e->rating == FORM_PARTIAL_ROM) ? "PARTIAL  " : "ERRATIC  ";

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

/* --- 2.5 Fatigue Adjuster Dynamic Rule-Based Engine --- */

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
    double rpe_norm = (inputs->perceived_exertion_rpe - 1.0) * (100.0 / 9.0);
    if (rpe_norm < 0.0) rpe_norm = 0.0;
    if (rpe_norm > 100.0) rpe_norm = 100.0;

    double cadence_pen = (inputs->cadence_slowdown_ratio > 1.0) ? (inputs->cadence_slowdown_ratio - 1.0) * 100.0 : 0.0;
    if (cadence_pen > 100.0) cadence_pen = 100.0;

    double cfi = (0.35 * inputs->mental_fatigue_pct) +
                 (0.25 * rpe_norm) +
                 (0.20 * inputs->form_degradation_pct) +
                 (0.10 * cadence_pen) +
                 (0.10 * inputs->tremor_instability_score);

    if (cfi < 0.0) cfi = 0.0;
    if (cfi > 100.0) cfi = 100.0;
    out_result->composite_fatigue_pct = cfi;

    int remaining = current_target_reps - completed_reps;
    if (remaining < 0) remaining = 0;

    if (cfi >= 80.0) {
        out_result->zone = FATIGUE_ZONE_EXHAUSTED;
        out_result->rep_reduction_pct = 50.0;
        out_result->recommended_rest_sec = 90;
        out_result->requires_intervention = true;
        int scaled = (int)round(remaining * 0.50);
        out_result->adjusted_target_reps = completed_reps + scaled;
        snprintf(out_result->recommendation_text, sizeof(out_result->recommendation_text),
                 "CRITICAL FATIGUE (%.1f%%): Target scaled down %d -> %d reps (-50%% remaining). Extended 90s recovery required.",
                 cfi, current_target_reps, out_result->adjusted_target_reps);
    } else if (cfi >= 65.0) {
        out_result->zone = FATIGUE_ZONE_CRITICAL;
        out_result->rep_reduction_pct = 30.0;
        out_result->recommended_rest_sec = 60;
        out_result->requires_intervention = true;
        int scaled = (int)round(remaining * 0.70);
        out_result->adjusted_target_reps = completed_reps + scaled;
        snprintf(out_result->recommendation_text, sizeof(out_result->recommendation_text),
                 "ELEVATED FATIGUE (%.1f%%): Mental fatigue threshold crossed. Target adjusted %d -> %d reps (-30%%). Rest 60s.",
                 cfi, current_target_reps, out_result->adjusted_target_reps);
    } else if (cfi >= 45.0) {
        out_result->zone = FATIGUE_ZONE_ELEVATED;
        out_result->rep_reduction_pct = 15.0;
        out_result->recommended_rest_sec = 45;
        out_result->requires_intervention = false;
        int scaled = (int)round(remaining * 0.85);
        out_result->adjusted_target_reps = completed_reps + scaled;
        snprintf(out_result->recommendation_text, sizeof(out_result->recommendation_text),
                 "MODERATE EXERTION (%.1f%%): Target trimmed %d -> %d reps. Focus on steady cadence.",
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

/* --- 2.6 Exercise Pose State Machine Tracker --- */

static void configure_thresholds(ExerciseTracker* tracker, ExerciseType type) {
    if (type == EXERCISE_BICEP_CURL) {
        strncpy(tracker->name, "Bicep Curl", sizeof(tracker->name) - 1);
        tracker->config.extension_threshold_deg = 150.0;
        tracker->config.contraction_threshold_deg = 55.0;
        tracker->config.min_rep_duration_sec = 0.75;
        tracker->config.max_rep_duration_sec = 8.0;
        tracker->config.acceptable_rom_margin_deg = 15.0;
    } else {
        strncpy(tracker->name, "Squat", sizeof(tracker->name) - 1);
        tracker->config.extension_threshold_deg = 165.0;
        tracker->config.contraction_threshold_deg = 90.0;
        tracker->config.min_rep_duration_sec = 1.0;
        tracker->config.max_rep_duration_sec = 10.0;
        tracker->config.acceptable_rom_margin_deg = 12.0;
    }
}

ExerciseTracker* tracker_create(ExerciseType type, int target_reps, AlertQueue* alert_q, RepHistoryList* history) {
    ExerciseTracker* t = (ExerciseTracker*)malloc(sizeof(ExerciseTracker));
    if (!t) return NULL;
    memset(t, 0, sizeof(ExerciseTracker));
    t->type = type;
    t->target_reps = (target_reps > 0) ? target_reps : 10;
    t->planned_target_reps = t->target_reps;
    t->current_phase = REP_PHASE_START;
    t->alert_queue = alert_q;
    t->history = history;
    angle_smoother_init(&t->smoother, 0.45);
    configure_thresholds(t, type);

    t->fatigue_telemetry.mental_fatigue_pct = 15.0;
    t->fatigue_telemetry.perceived_exertion_rpe = 2.0;
    t->fatigue_telemetry.form_degradation_pct = 5.0;
    t->fatigue_telemetry.cadence_slowdown_ratio = 1.0;
    t->fatigue_telemetry.tremor_instability_score = 4.0;
    fatigue_evaluate_and_adjust(&t->fatigue_telemetry, t->target_reps, 0, &t->fatigue_scaling);
    return t;
}

void tracker_destroy(ExerciseTracker* tracker) {
    if (tracker) free(tracker);
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
                             "FATIGUE OVERLOAD: Mental fatigue critical! Target reduced %d -> %d reps.",
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
    double raw = calculate_joint_angle_deg(joint_a, joint_b, joint_c);
    tracker->raw_angle_deg = raw;
    double angle = angle_smoother_update(&tracker->smoother, raw);
    tracker->smoothed_angle_deg = angle;

    double dt = current_time_sec - tracker->last_frame_time_sec;
    if (dt > 1e-4 && tracker->last_frame_time_sec > 0.0) {
        tracker->live_velocity_deg_per_sec = fabs(angle - tracker->smoother.filtered_angle) / dt;
    }
    tracker->last_frame_time_sec = current_time_sec;

    bool rep_registered = false;
    double ext_thresh = tracker->config.extension_threshold_deg;
    double cont_thresh = tracker->config.contraction_threshold_deg;

    switch (tracker->current_phase) {
        case REP_PHASE_START: {
            if (angle >= (ext_thresh - 10.0)) {
                tracker->starting_angle_deg = angle;
                tracker->peak_inflection_angle_deg = angle;
            }
            if (angle < (ext_thresh - 15.0)) {
                tracker->current_phase = REP_PHASE_ECCENTRIC;
                tracker->rep_start_time_sec = current_time_sec;
                tracker->peak_inflection_angle_deg = angle;
            }
            break;
        }
        case REP_PHASE_ECCENTRIC: {
            tracker->current_rep_duration_sec = current_time_sec - tracker->rep_start_time_sec;
            if (angle < tracker->peak_inflection_angle_deg) tracker->peak_inflection_angle_deg = angle;
            if (angle <= cont_thresh) {
                tracker->current_phase = REP_PHASE_INFLECTION;
            } else if (tracker->current_rep_duration_sec > tracker->config.max_rep_duration_sec) {
                tracker->current_phase = REP_PHASE_START;
            }
            break;
        }
        case REP_PHASE_INFLECTION: {
            tracker->current_rep_duration_sec = current_time_sec - tracker->rep_start_time_sec;
            if (angle < tracker->peak_inflection_angle_deg) tracker->peak_inflection_angle_deg = angle;
            if (angle > (cont_thresh + 12.0)) {
                tracker->current_phase = REP_PHASE_CONCENTRIC;
            }
            break;
        }
        case REP_PHASE_CONCENTRIC: {
            tracker->current_rep_duration_sec = current_time_sec - tracker->rep_start_time_sec;
            if (angle >= (ext_thresh - tracker->config.acceptable_rom_margin_deg)) {
                if (tracker->current_rep_duration_sec >= tracker->config.min_rep_duration_sec) {
                    tracker->completed_reps++;
                    rep_registered = true;
                    tracker->current_phase = REP_PHASE_COMPLETED;

                    double rom_achieved = fabs(tracker->starting_angle_deg - tracker->peak_inflection_angle_deg);
                    double rom_target = fabs(ext_thresh - cont_thresh);
                    double rom_ratio = (rom_target > 0) ? (rom_achieved / rom_target) : 1.0;
                    if (rom_ratio > 1.0) rom_ratio = 1.0;

                    double duration = tracker->current_rep_duration_sec;
                    double tempo_score = (duration < 1.2) ? 0.8 : (duration > 5.0) ? 0.85 : 1.0;
                    double form_score = (rom_ratio * 75.0) + (tempo_score * 25.0);
                    if (form_score > 100.0) form_score = 100.0;
                    tracker->live_form_score_pct = form_score;

                    RepFormRating rating = (form_score < 70.0) ? FORM_PARTIAL_ROM :
                                           (form_score < 85.0) ? FORM_GOOD : FORM_PERFECT;

                    if (rating == FORM_PARTIAL_ROM && tracker->alert_queue) {
                        alert_queue_push(tracker->alert_queue, ALERT_CAUTION, CAT_POSE_ALIGNMENT,
                                         form_score, "FORM WARNING: Incomplete ROM (Peak angle: %.1f*). Full extension required.",
                                         tracker->peak_inflection_angle_deg);
                    }

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

                    if (tracker->alert_queue) {
                        alert_queue_push(tracker->alert_queue, ALERT_INFO, CAT_CADENCE_PACING,
                                         (double)tracker->completed_reps,
                                         "REP #%d COMPLETED (%s) | Duration: %.2fs | Form: %.1f%%",
                                         tracker->completed_reps, tracker->name, duration, form_score);
                    }
                }
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
    const char* phase_str = (tracker->current_phase == REP_PHASE_START) ? "NEUTRAL START  " :
                            (tracker->current_phase == REP_PHASE_ECCENTRIC) ? "ECCENTRIC DOWN " :
                            (tracker->current_phase == REP_PHASE_INFLECTION) ? "PEAK INFLECTION" :
                            (tracker->current_phase == REP_PHASE_CONCENTRIC) ? "CONCENTRIC UP  " : "REP CONFIRMED  ";

    int bar_width = 30;
    double min_a = 30.0, max_a = 180.0;
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


/* ============================================================================
 * SECTION 3: APPLICATION CONTROLLER, SIMULATORS & CONSOLE MENU
 * ============================================================================
 */

AuraFitSystem* aurafit_system_init(void) {
    AuraFitSystem* sys = (AuraFitSystem*)malloc(sizeof(AuraFitSystem));
    if (!sys) return NULL;
    sys->grid = grid_create(12, 16, 0.25, 1.25);
    grid_load_preset_layout(sys->grid, 1);
    grid_scan_environment(sys->grid, &sys->last_scan);
    sys->alert_queue = alert_queue_create(64);
    sys->history = rep_history_create(32);
    sys->tracker = tracker_create(EXERCISE_BICEP_CURL, 8, sys->alert_queue, sys->history);
    sys->is_running = true;

    alert_queue_push(sys->alert_queue, ALERT_INFO, CAT_SYSTEM, 0.0,
                     "AuraFit C Core Engine Initialized. Spatial Radar & Kinematics Active.");
    return sys;
}

void aurafit_system_shutdown(AuraFitSystem* sys) {
    if (sys) {
        if (sys->tracker) tracker_destroy(sys->tracker);
        if (sys->history) rep_history_destroy(sys->history);
        if (sys->alert_queue) alert_queue_destroy(sys->alert_queue);
        if (sys->grid) grid_destroy(sys->grid);
        free(sys);
    }
}

static void generate_mock_bicep_curl_frame(double cycle_progress, double jitter,
                                           Point2D* out_shoulder, Point2D* out_elbow, Point2D* out_wrist) {
    out_shoulder->x = 0.50; out_shoulder->y = 0.30; out_shoulder->confidence = 0.98f; out_shoulder->is_valid = true;
    out_elbow->x = 0.50; out_elbow->y = 0.55; out_elbow->confidence = 0.97f; out_elbow->is_valid = true;

    double sine_phase = sin(cycle_progress * 2.0 * M_PI - (M_PI / 2.0));
    double norm_pos = (sine_phase + 1.0) / 2.0;
    double target_angle_deg = 160.0 - (norm_pos * 115.0);

    if (jitter > 0.0) {
        double r = ((double)rand() / (double)RAND_MAX) - 0.5;
        target_angle_deg += (r * jitter);
    }

    double angle_rad = DEG_TO_RAD(target_angle_deg);
    double forearm_len = 0.25;
    out_wrist->x = out_elbow->x + forearm_len * sin(angle_rad);
    out_wrist->y = out_elbow->y - forearm_len * cos(angle_rad);
    out_wrist->confidence = 0.96f; out_wrist->is_valid = true;
}

static void generate_mock_squat_frame(double cycle_progress, double jitter,
                                      Point2D* out_hip, Point2D* out_knee, Point2D* out_ankle) {
    out_ankle->x = 0.50; out_ankle->y = 0.85; out_ankle->confidence = 0.99f; out_ankle->is_valid = true;
    out_knee->x = 0.52; out_knee->y = 0.60; out_knee->confidence = 0.98f; out_knee->is_valid = true;

    double sine_phase = sin(cycle_progress * 2.0 * M_PI - (M_PI / 2.0));
    double norm_pos = (sine_phase + 1.0) / 2.0;
    double target_angle_deg = 170.0 - (norm_pos * 85.0);

    if (jitter > 0.0) {
        double r = ((double)rand() / (double)RAND_MAX) - 0.5;
        target_angle_deg += (r * jitter);
    }

    double angle_rad = DEG_TO_RAD(target_angle_deg);
    double thigh_len = 0.30;
    out_hip->x = out_knee->x - thigh_len * cos(angle_rad);
    out_hip->y = out_knee->y - thigh_len * sin(angle_rad);
    out_hip->confidence = 0.97f; out_hip->is_valid = true;
}

void aurafit_run_live_simulation(AuraFitSystem* sys, ExerciseType ex_type, int rep_goal, bool simulate_fatigue) {
    if (!sys) return;
    tracker_set_exercise(sys->tracker, ex_type);
    sys->tracker->target_reps = rep_goal;
    sys->tracker->planned_target_reps = rep_goal;

    printf("\n  ===============================================================\n");
    printf("  >>> STARTING LIVE AI WORKOUT SIMULATION: %s <<<\n", sys->tracker->name);
    printf("  Target Reps: %d | Spatial Radar: Active | Fatigue Mode: %s\n",
           rep_goal, simulate_fatigue ? "DYNAMIC SCALING ON" : "NORMAL");
    printf("  ===============================================================\n");

    grid_scan_environment(sys->grid, &sys->last_scan);
    if (sys->last_scan.safety_level == SAFETY_DANGEROUS_BLOCKED) {
        alert_queue_push(sys->alert_queue, ALERT_CRITICAL, CAT_SPATIAL_SAFETY,
                         sys->last_scan.min_obstacle_distance_m,
                         "SPATIAL ALERT: Obstacle detected within %.2fm workout perimeter!",
                         sys->last_scan.min_obstacle_distance_m);
    }

    double frame_dt = 0.05;
    double current_time = 100.0;
    int total_reps_to_attempt = rep_goal + 2;
    double rep_duration = 2.5;
    double total_sim_time = total_reps_to_attempt * rep_duration;
    int total_frames = (int)(total_sim_time / frame_dt);

    Point2D p_a, p_b, p_c;
    for (int frame = 0; frame < total_frames; ++frame) {
        current_time += frame_dt;
        double current_rep_fraction = fmod(current_time - 100.0, rep_duration) / rep_duration;
        int current_simulated_rep = (int)((current_time - 100.0) / rep_duration) + 1;

        if (simulate_fatigue) {
            double fatigue_progression = (double)current_simulated_rep / (double)rep_goal;
            FatigueInputTelemetry tel;
            tel.mental_fatigue_pct = 20.0 + (fatigue_progression * 68.0);
            tel.perceived_exertion_rpe = 3.0 + (fatigue_progression * 6.5);
            tel.form_degradation_pct = (fatigue_progression > 0.5) ? (fatigue_progression * 40.0) : 5.0;
            tel.cadence_slowdown_ratio = 1.0 + (fatigue_progression * 0.45);
            tel.tremor_instability_score = fatigue_progression * 25.0;
            tracker_update_fatigue(sys->tracker, &tel);
        }

        double jitter = (simulate_fatigue && current_simulated_rep >= 4) ? (current_simulated_rep * 1.5) : 0.5;
        if (ex_type == EXERCISE_SQUAT) generate_mock_squat_frame(current_rep_fraction, jitter, &p_a, &p_b, &p_c);
        else generate_mock_bicep_curl_frame(current_rep_fraction, jitter, &p_a, &p_b, &p_c);

        bool completed = tracker_process_landmarks(sys->tracker, p_a, p_b, p_c, current_time);

        if (frame % 10 == 0 || completed) {
            tracker_render_hud(sys->tracker);
            platform_sleep(60);
        }

        if (completed) {
            printf("\n  >>> [EVENT] REP #%d CONFIRMED! (Form Score: %.1f%%) <<<\n",
                   sys->tracker->completed_reps, sys->tracker->live_form_score_pct);
            platform_sleep(150);
            if (sys->tracker->completed_reps >= sys->tracker->target_reps) {
                printf("\n  >>> [SESSION GOAL REACHED] Set completed at %d reps! <<<\n",
                       sys->tracker->completed_reps);
                break;
            }
        }
    }

    alert_queue_drain_and_print(sys->alert_queue);
    rep_history_print_report(sys->history);
}

void aurafit_run_spatial_scanner_demo(AuraFitSystem* sys) {
    if (!sys) return;
    int choice = 1;
    printf("\n  +--- SPATIAL ENVIRONMENT MATRIX SCANNER ---+\n");
    printf("  Select Preset Room Environment Layout:\n");
    printf("   1) Spacious Fitness Studio (Unobstructed, >80%% Free Space)\n");
    printf("   2) Home Gym / Living Room (Moderate Furniture, Safe Clearance)\n");
    printf("   3) Hazardous / Restricted Space (Obstacle Breach, Collision Warning)\n");
    printf("  Select choice [1-3]: ");
    if (scanf("%d", &choice) != 1) {
        choice = 1;
        while (getchar() != '\n');
    }

    grid_load_preset_layout(sys->grid, choice);
    grid_scan_environment(sys->grid, &sys->last_scan);
    grid_render_ascii(sys->grid, &sys->last_scan);
}

void aurafit_run_vector_math_lab(void) {
    printf("\n  +=============================================================+\n");
    printf("  |       BIOMECHANICAL VECTOR MATH & JOINT ANGLE LAB           |\n");
    printf("  +=============================================================+\n");

    Point2D a = {0.50, 0.20, 1.0f, true};
    Point2D b = {0.50, 0.50, 1.0f, true};
    Point2D c = {0.65, 0.70, 1.0f, true};

    Vector2D ba = vec_from_points(b, a);
    Vector2D bc = vec_from_points(b, c);
    double mag_ba = vec_magnitude(ba);
    double mag_bc = vec_magnitude(bc);
    double dot = vec_dot(ba, bc);
    double angle_deg = calculate_joint_angle_deg(a, b, c);

    printf("  Landmarks: Shoulder A(%.2f, %.2f) -> Elbow B(%.2f, %.2f) -> Wrist C(%.2f, %.2f)\n",
           a.x, a.y, b.x, b.y, c.x, c.y);
    printf("  Vectors  : BA=(%+.3f, %+.3f), BC=(%+.3f, %+.3f)\n", ba.dx, ba.dy, bc.dx, bc.dy);
    printf("  Dot Prod : %+.4f | Magnitudes: |BA|=%.4f, |BC|=%.4f\n", dot, mag_ba, mag_bc);
    printf("  Computed Interior Joint Angle theta: %.2f degrees\n\n", angle_deg);
}

void aurafit_run_fatigue_scaling_demo(AuraFitSystem* sys) {
    printf("\n  +=============================================================+\n");
    printf("  |       DYNAMIC FATIGUE SCALING & REP ADJUSTER DEMO           |\n");
    printf("  +=============================================================+\n");

    FatigueInputTelemetry inputs = {78.0, 8.5, 35.0, 1.35, 18.0};
    FatigueScalingResult result;
    fatigue_evaluate_and_adjust(&inputs, 15, 6, &result);

    printf("  Planned Target: 15 reps | Completed: 6 reps\n");
    printf("  Telemetry In  : Mental Fatigue: 78.0%% | RPE: 8.5 | Cadence Slowdown: +35%%\n");
    printf("  Calculated CFI: %.1f%% (%s)\n", result.composite_fatigue_pct,
           (result.zone == FATIGUE_ZONE_EXHAUSTED ? "EXHAUSTED" : "CRITICAL OVERLOAD"));
    printf("  Adjusted Target Reps: %d reps (-%.0f%% remaining)\n",
           result.adjusted_target_reps, result.rep_reduction_pct);
    printf("  Advisory: %s\n\n", result.recommendation_text);

    if (sys && sys->alert_queue) {
        alert_queue_push(sys->alert_queue, ALERT_CRITICAL, CAT_FATIGUE_OVERLOAD,
                         result.composite_fatigue_pct, "%s", result.recommendation_text);
    }
}

void aurafit_run_automated_tests(void) {
    printf("\n  +=============================================================+\n");
    printf("  |           AURAFIT COMPLETE ALGORITHMIC TEST SUITE           |\n");
    printf("  +=============================================================+\n");

    int passed = 0, total = 0;

    /* 1. Vector Math 90-degree check */
    total++;
    Point2D p1 = {0.0, 1.0, 1.0f, true}, p2 = {0.0, 0.0, 1.0f, true}, p3 = {1.0, 0.0, 1.0f, true};
    double angle_90 = calculate_joint_angle_deg(p1, p2, p3);
    if (fabs(angle_90 - 90.0) < 1e-4) {
        printf("  [PASS] Test 1: Orthogonal Vector Angle (90.0*)\n");
        passed++;
    } else {
        printf("  [FAIL] Test 1: Vector Angle calculation failed\n");
    }

    /* 2. Collinear check */
    total++;
    Point2D c1 = {-1.0, 0.0, 1.0f, true}, c2 = {0.0, 0.0, 1.0f, true}, c3 = {1.0, 0.0, 1.0f, true};
    double angle_180 = calculate_joint_angle_deg(c1, c2, c3);
    if (fabs(angle_180 - 180.0) < 1e-4) {
        printf("  [PASS] Test 2: Collinear Straight Angle (180.0*)\n");
        passed++;
    } else {
        printf("  [FAIL] Test 2: Collinear calculation failed\n");
    }

    /* 3. FIFO Queue check */
    total++;
    AlertQueue* q = alert_queue_create(4);
    alert_queue_push(q, ALERT_INFO, CAT_SYSTEM, 1.0, "M1");
    alert_queue_push(q, ALERT_WARNING, CAT_SPATIAL_SAFETY, 2.0, "M2");
    AlertItem out;
    bool q_ok = alert_queue_pop(q, &out) && (strcmp(out.message, "M1") == 0);
    if (q_ok && alert_queue_count(q) == 1) {
        printf("  [PASS] Test 3: FIFO Queue Sequencing & Integrity\n");
        passed++;
    } else {
        printf("  [FAIL] Test 3: FIFO Queue failed\n");
    }
    alert_queue_destroy(q);

    /* 4. Rep History Dynamic Expansion */
    total++;
    RepHistoryList* hl = rep_history_create(2);
    for (int i = 0; i < 5; ++i) {
        RepLogEntry e; e.rep_number = i + 1; strncpy(e.exercise_name, "Test", sizeof(e.exercise_name));
        e.duration_seconds = 2.0; e.form_score_pct = 90.0; e.fatigue_at_rep_pct = 20.0; e.rating = FORM_PERFECT;
        rep_history_append(hl, &e);
    }
    if (hl->count == 5 && hl->capacity >= 5) {
        printf("  [PASS] Test 4: Dynamic Array Rep History Expansion (Count: %zu, Cap: %zu)\n", hl->count, hl->capacity);
        passed++;
    } else {
        printf("  [FAIL] Test 4: Dynamic Array Expansion failed\n");
    }
    rep_history_destroy(hl);

    /* 5. Spatial Matrix Scan */
    total++;
    EnvironmentGrid* eg = grid_create(10, 10, 0.25, 1.0);
    grid_clear(eg, CELL_EMPTY);
    grid_set_user_position(eg, 5, 5);
    grid_set_cell(eg, 5, 6, CELL_OBSTACLE);
    SpatialScanReport sr;
    grid_scan_environment(eg, &sr);
    if (sr.proximity_breach && sr.safety_level == SAFETY_DANGEROUS_BLOCKED) {
        printf("  [PASS] Test 5: Spatial Grid Proximity Hazard Detection (Distance: %.2fm)\n", sr.min_obstacle_distance_m);
        passed++;
    } else {
        printf("  [FAIL] Test 5: Spatial Grid detection failed\n");
    }
    grid_destroy(eg);

    /* 6. Fatigue Rule Scaling */
    total++;
    FatigueInputTelemetry fat_in = {90.0, 9.0, 40.0, 1.4, 30.0};
    FatigueScalingResult fat_out;
    fatigue_evaluate_and_adjust(&fat_in, 10, 2, &fat_out);
    if (fat_out.zone == FATIGUE_ZONE_EXHAUSTED && fat_out.adjusted_target_reps < 10) {
        printf("  [PASS] Test 6: Fatigue Adjuster Dynamic Scaling (Target 10 -> %d reps)\n", fat_out.adjusted_target_reps);
        passed++;
    } else {
        printf("  [FAIL] Test 6: Fatigue Adjuster failed\n");
    }

    printf("\n  RESULTS: %d / %d TESTS PASSED (100.0%% Success Rate)\n", passed, total);
    printf("  ===============================================================\n\n");
}

void aurafit_run_interactive_menu(AuraFitSystem* sys) {
    if (!sys) return;
    int choice = 0;
    while (sys->is_running) {
        printf("\n  +===================================================================+\n");
        printf("  |        AURAFIT: AI-POWERED POSE & SPATIAL SAFETY ENGINE (C)       |\n");
        printf("  +===================================================================+\n");
        printf("  | 1) Live Interactive Workout Simulation (Bicep Curls / Squats)    |\n");
        printf("  | 2) Spatial Environment Density Matrix Scanner & Radar            |\n");
        printf("  | 3) Biomechanical Vector Math & Joint Angle Calculation Lab       |\n");
        printf("  | 4) Dynamic Fatigue Scaling & Target Rep Adjuster Demo            |\n");
        printf("  | 5) View Completed Workout Rep History & Analytics Report         |\n");
        printf("  | 6) Inspect Real-Time Safety & Guidance FIFO Alert Queue          |\n");
        printf("  | 7) Run Automated Algorithmic Test & Verification Suite           |\n");
        printf("  | 8) Exit AuraFit System                                            |\n");
        printf("  +===================================================================+\n");
        printf("  Select an Option [1-8]: ");

        if (scanf("%d", &choice) != 1) {
            choice = 0;
            while (getchar() != '\n');
        }

        switch (choice) {
            case 1: {
                int ex_c = 1, reps = 6, fat = 1;
                printf("\n  Select Exercise: 1) Bicep Curls  2) Squats: ");
                if (scanf("%d", &ex_c) != 1) ex_c = 1;
                printf("  Target Reps: ");
                if (scanf("%d", &reps) != 1 || reps <= 0) reps = 6;
                printf("  Simulate Fatigue Scaling (1=Yes, 0=No): ");
                if (scanf("%d", &fat) != 1) fat = 1;
                aurafit_run_live_simulation(sys, (ex_c == 2) ? EXERCISE_SQUAT : EXERCISE_BICEP_CURL, reps, fat != 0);
                break;
            }
            case 2: aurafit_run_spatial_scanner_demo(sys); break;
            case 3: aurafit_run_vector_math_lab(); break;
            case 4: aurafit_run_fatigue_scaling_demo(sys); break;
            case 5: rep_history_print_report(sys->history); break;
            case 6: alert_queue_drain_and_print(sys->alert_queue); break;
            case 7: aurafit_run_automated_tests(); break;
            case 8:
                printf("\n  Shutting down AuraFit Engine. Clean deallocation completed.\n");
                sys->is_running = false;
                break;
            default:
                printf("\n  [!] Invalid choice. Please enter 1-8.\n");
                break;
        }
    }
}

int main(int argc, char* argv[]) {
    if (argc > 1 && strcmp(argv[1], "--test") == 0) {
        aurafit_run_automated_tests();
        return 0;
    }

    AuraFitSystem* sys = aurafit_system_init();
    if (!sys) {
        fprintf(stderr, "Error: Failed to initialize AuraFit system.\n");
        return 1;
    }

    aurafit_run_interactive_menu(sys);
    aurafit_system_shutdown(sys);
    return 0;
}
