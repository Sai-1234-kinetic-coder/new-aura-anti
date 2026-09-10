/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: spatial_matrix.h
 * Description: 2D Spatial Density Grid, Collision & Proximity Safety Scanner
 * ============================================================================
 */

#ifndef AURAFIT_SPATIAL_MATRIX_H
#define AURAFIT_SPATIAL_MATRIX_H

#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Cell Classification Codes */
typedef enum {
    CELL_EMPTY     = 0,  /**< Free space / unobstructed workout zone */
    CELL_BUFFER    = 1,  /**< Cautionary buffer boundary */
    CELL_OBSTACLE  = 2,  /**< Solid obstacle, furniture, or wall */
    CELL_HAZARD    = 3,  /**< Dynamic hazard or sharp boundary */
    CELL_USER      = 9   /**< User centroid / active tracking zone */
} CellType;

/* Environmental Safety Assessment Levels */
typedef enum {
    SAFETY_EXCELLENT,          /**< > 75% free space, generous obstacle clearance */
    SAFETY_ADEQUATE,           /**< 55% - 75% free space, safe for stationary exercise */
    SAFETY_CONGESTED_WARNING,  /**< 35% - 54% free space, risk of collision */
    SAFETY_DANGEROUS_BLOCKED   /**< < 35% free space or obstacle within critical radius */
} SafetyLevel;

/**
 * @brief Dynamic contiguous 2D Grid structure for spatial density scanning.
 */
typedef struct {
    int rows;                  /**< Grid height (N) */
    int cols;                  /**< Grid width (M) */
    double cell_size_meters;   /**< Real-world metric resolution (e.g. 0.25m) */
    int* cells;                /**< Contiguous row-major memory block (N * M) */
    int user_row;              /**< Tracked user grid row */
    int user_col;              /**< Tracked user grid column */
    double safe_radius_meters; /**< Required obstacle clearance radius */
} EnvironmentGrid;

/**
 * @brief Comprehensive Spatial Scan Telemetry Report.
 */
typedef struct {
    int total_cells;
    int empty_cells;
    int buffer_cells;
    int obstacle_cells;
    int hazard_cells;
    double free_space_ratio;         /**< 0.0 - 1.0 */
    double obstacle_density_ratio;   /**< 0.0 - 1.0 */
    double min_obstacle_distance_m;  /**< Metric distance to closest obstacle */
    bool user_in_bounds;
    bool proximity_breach;           /**< True if obstacle is closer than safe radius */
    double safety_score;             /**< Composite score [0.0 - 100.0] */
    SafetyLevel safety_level;        /**< Overall environment classification */
    char status_advisory[128];       /**< Human-readable diagnostic text */
} SpatialScanReport;

/* --- Matrix Engine Function Prototypes --- */

/**
 * @brief Dynamically allocates and initializes an N x M environment grid.
 */
EnvironmentGrid* grid_create(int rows, int cols, double cell_size_m, double safe_radius_m);

/**
 * @brief Releases dynamically allocated grid memory.
 */
void grid_destroy(EnvironmentGrid* grid);

/**
 * @brief Resets all cells in the grid to a specific cell type.
 */
void grid_clear(EnvironmentGrid* grid, CellType fill_type);

/**
 * @brief Sets a cell value with strict bounds checking.
 */
bool grid_set_cell(EnvironmentGrid* grid, int r, int c, CellType type);

/**
 * @brief Retrieves a cell value with bounds safety.
 */
int grid_get_cell(const EnvironmentGrid* grid, int r, int c);

/**
 * @brief Sets the user's position within the grid and automatically stamps CELL_USER.
 */
bool grid_set_user_position(EnvironmentGrid* grid, int r, int c);

/**
 * @brief Inserts a rectangular obstacle/wall region into the matrix.
 */
void grid_add_obstacle_rect(EnvironmentGrid* grid, int top_r, int left_c, int height, int width);

/**
 * @brief Populates realistic preset room layouts (Spacious, Home Gym, Tight Studio).
 */
void grid_load_preset_layout(EnvironmentGrid* grid, int preset_id);

/**
 * @brief Core Spatial Scanning Algorithm: Evaluates space density, free/obstacle ratio,
 *        proximity clearance, and produces a complete Safety Telemetry Report.
 */
void grid_scan_environment(const EnvironmentGrid* grid, SpatialScanReport* report);

/**
 * @brief Renders the 2D grid to console with ASCII/Unicode visual symbols.
 */
void grid_render_ascii(const EnvironmentGrid* grid, const SpatialScanReport* report);

#ifdef __cplusplus
}
#endif

#endif /* AURAFIT_SPATIAL_MATRIX_H */
