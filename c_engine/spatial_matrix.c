/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: spatial_matrix.c
 * Description: 2D Spatial Density Grid Implementation & Collision Analysis
 * ============================================================================
 */

#include "spatial_matrix.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

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

    size_t total_elements = (size_t)rows * (size_t)cols;
    grid->cells = (int*)calloc(total_elements, sizeof(int));
    if (!grid->cells) {
        free(grid);
        return NULL;
    }

    /* Stamp user position by default */
    grid_set_cell(grid, grid->user_row, grid->user_col, CELL_USER);
    return grid;
}

void grid_destroy(EnvironmentGrid* grid) {
    if (grid) {
        if (grid->cells) {
            free(grid->cells);
            grid->cells = NULL;
        }
        free(grid);
    }
}

void grid_clear(EnvironmentGrid* grid, CellType fill_type) {
    if (!grid || !grid->cells) return;
    size_t total = (size_t)grid->rows * (size_t)grid->cols;
    for (size_t i = 0; i < total; ++i) {
        grid->cells[i] = (int)fill_type;
    }
}

bool grid_set_cell(EnvironmentGrid* grid, int r, int c, CellType type) {
    if (!grid || !grid->cells) return false;
    if (r < 0 || r >= grid->rows || c < 0 || c >= grid->cols) return false;

    grid->cells[r * grid->cols + c] = (int)type;
    return true;
}

int grid_get_cell(const EnvironmentGrid* grid, int r, int c) {
    if (!grid || !grid->cells) return -1;
    if (r < 0 || r >= grid->rows || c < 0 || c >= grid->cols) return -1;

    return grid->cells[r * grid->cols + c];
}

bool grid_set_user_position(EnvironmentGrid* grid, int r, int c) {
    if (!grid || !grid->cells) return false;
    if (r < 0 || r >= grid->rows || c < 0 || c >= grid->cols) return false;

    /* Clear old position if it was user stamped */
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

    /* Build outer perimeter walls */
    for (int r = 0; r < rows; ++r) {
        grid_set_cell(grid, r, 0, CELL_OBSTACLE);
        grid_set_cell(grid, r, cols - 1, CELL_OBSTACLE);
    }
    for (int c = 0; c < cols; ++c) {
        grid_set_cell(grid, 0, c, CELL_OBSTACLE);
        grid_set_cell(grid, rows - 1, c, CELL_OBSTACLE);
    }

    switch (preset_id) {
        case 1: /* Spacious Fitness Studio - Open and safe */
            grid_set_user_position(grid, rows / 2, cols / 2);
            /* Corner storage only */
            grid_set_cell(grid, 1, 1, CELL_BUFFER);
            grid_set_cell(grid, 1, cols - 2, CELL_BUFFER);
            break;

        case 2: /* Typical Living Room / Home Gym - Moderate Furniture */
            grid_set_user_position(grid, rows / 2, cols / 2);
            /* Sofa on north wall */
            grid_add_obstacle_rect(grid, 1, cols / 4, 2, cols / 2);
            /* Coffee table nearby */
            grid_set_cell(grid, rows - 3, 2, CELL_OBSTACLE);
            grid_set_cell(grid, rows - 3, 3, CELL_OBSTACLE);
            /* Buffer zones around obstacles */
            for (int c = (cols / 4) - 1; c <= (3 * cols / 4); ++c) {
                if (grid_get_cell(grid, 3, c) == CELL_EMPTY) {
                    grid_set_cell(grid, 3, c, CELL_BUFFER);
                }
            }
            break;

        case 3: /* Hazardous / Constrained Workspace - Danger Alert */
            grid_set_user_position(grid, rows / 2, cols / 2);
            /* Desk and chairs close to user */
            grid_add_obstacle_rect(grid, (rows / 2) - 1, (cols / 2) + 1, 3, 2);
            grid_add_obstacle_rect(grid, (rows / 2) + 1, (cols / 2) - 3, 2, 2);
            grid_set_cell(grid, (rows / 2) - 1, (cols / 2) - 1, CELL_HAZARD);
            break;

        default:
            grid_set_user_position(grid, rows / 2, cols / 2);
            break;
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
            switch (cell_val) {
                case CELL_EMPTY:
                    report->empty_cells++;
                    break;
                case CELL_BUFFER:
                    report->buffer_cells++;
                    break;
                case CELL_OBSTACLE:
                    report->obstacle_cells++;
                    if (report->user_in_bounds) {
                        double dr = (r - u_r) * grid->cell_size_meters;
                        double dc = (c - u_c) * grid->cell_size_meters;
                        double dist = sqrt(dr * dr + dc * dc);
                        if (dist < report->min_obstacle_distance_m) {
                            report->min_obstacle_distance_m = dist;
                        }
                    }
                    break;
                case CELL_HAZARD:
                    report->hazard_cells++;
                    if (report->user_in_bounds) {
                        double dr = (r - u_r) * grid->cell_size_meters;
                        double dc = (c - u_c) * grid->cell_size_meters;
                        double dist = sqrt(dr * dr + dc * dc);
                        if (dist < report->min_obstacle_distance_m) {
                            report->min_obstacle_distance_m = dist;
                        }
                    }
                    break;
                case CELL_USER:
                    report->empty_cells++; /* Count user cell as valid operational volume */
                    break;
                default:
                    break;
            }
        }
    }

    if (report->total_cells > 0) {
        report->free_space_ratio = (double)report->empty_cells / (double)report->total_cells;
        report->obstacle_density_ratio = (double)(report->obstacle_cells + report->hazard_cells) / (double)report->total_cells;
    }

    /* Proximity evaluation */
    report->proximity_breach = (report->min_obstacle_distance_m < grid->safe_radius_meters);

    /* Compute composite safety score (0 - 100) */
    double ratio_component = report->free_space_ratio * 60.0; /* Up to 60 pts */
    double clearance_component = 0.0;
    if (grid->safe_radius_meters > 0.0) {
        double clearance_ratio = report->min_obstacle_distance_m / grid->safe_radius_meters;
        if (clearance_ratio > 1.5) clearance_ratio = 1.5;
        clearance_component = (clearance_ratio / 1.5) * 40.0; /* Up to 40 pts */
    }
    report->safety_score = ratio_component + clearance_component;
    if (report->hazard_cells > 0) {
        report->safety_score -= (report->hazard_cells * 5.0);
    }
    if (report->safety_score < 0.0) report->safety_score = 0.0;
    if (report->safety_score > 100.0) report->safety_score = 100.0;

    /* Classify Safety Level */
    if (report->proximity_breach || report->free_space_ratio < 0.35 || report->hazard_cells > 2) {
        report->safety_level = SAFETY_DANGEROUS_BLOCKED;
        snprintf(report->status_advisory, sizeof(report->status_advisory),
                 "CRITICAL: Obstacle breach within %.2fm! Clear workout zone before moving.",
                 report->min_obstacle_distance_m);
    } else if (report->free_space_ratio < 0.55 || report->min_obstacle_distance_m < (grid->safe_radius_meters * 1.25)) {
        report->safety_level = SAFETY_CONGESTED_WARNING;
        snprintf(report->status_advisory, sizeof(report->status_advisory),
                 "CAUTION: Restricted clearance (%.2fm). Avoid wide lateral swings.",
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
    for (int c = 0; c < grid->cols; ++c) {
        printf(" %d", c % 10);
    }
    printf("\n  +");
    for (int c = 0; c < grid->cols; ++c) {
        printf("--");
    }
    printf("-+\n");

    for (int r = 0; r < grid->rows; ++r) {
        printf("%2d|", r);
        for (int c = 0; c < grid->cols; ++c) {
            int val = grid->cells[r * grid->cols + c];
            if (r == grid->user_row && c == grid->user_col) {
                printf(" U"); /* User Landmark Centroid */
            } else {
                switch (val) {
                    case CELL_EMPTY:
                        printf(" ."); /* Empty Space */
                        break;
                    case CELL_BUFFER:
                        printf(" ~"); /* Buffer Zone */
                        break;
                    case CELL_OBSTACLE:
                        printf(" #"); /* Solid Obstacle / Wall */
                        break;
                    case CELL_HAZARD:
                        printf(" !"); /* Hazard / Edge */
                        break;
                    default:
                        printf(" ?");
                        break;
                }
            }
        }
        printf(" |\n");
    }

    printf("  +");
    for (int c = 0; c < grid->cols; ++c) {
        printf("--");
    }
    printf("-+\n");
    printf("  Legend: [U] User  [.] Free (0)  [~] Buffer (1)  [#] Obstacle (2)  [!] Hazard (3)\n");

    if (report) {
        const char* lvl_str = "UNKNOWN";
        switch (report->safety_level) {
            case SAFETY_EXCELLENT:         lvl_str = "[+] EXCELLENT - ZONE SAFE"; break;
            case SAFETY_ADEQUATE:          lvl_str = "[~] ADEQUATE - SAFE"; break;
            case SAFETY_CONGESTED_WARNING: lvl_str = "[!] CONGESTED - CAUTION"; break;
            case SAFETY_DANGEROUS_BLOCKED: lvl_str = "[X] DANGEROUS - COLLISION RISK"; break;
        }

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
