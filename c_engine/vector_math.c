/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: vector_math.c
 * Description: 2D Euclidean Vector Math Implementation
 * ============================================================================
 */

#include "vector_math.h"
#include <math.h>

double calculate_joint_angle_deg(Point2D a, Point2D b, Point2D c) {
    /* Form vectors BA (vertex B to point A) and BC (vertex B to point C) */
    Vector2D ba = vec_from_points(b, a);
    Vector2D bc = vec_from_points(b, c);

    double mag_ba = vec_magnitude(ba);
    double mag_bc = vec_magnitude(bc);

    /* Guard against zero-length vectors (collocated keypoints) */
    if (mag_ba < 1e-7 || mag_bc < 1e-7) {
        return 0.0;
    }

    /* Compute dot product */
    double dot = vec_dot(ba, bc);

    /* Cosine ratio with clamping to domain [-1.0, 1.0] for safe acos */
    double cosine = dot / (mag_ba * mag_bc);
    if (cosine > 1.0) {
        cosine = 1.0;
    } else if (cosine < -1.0) {
        cosine = -1.0;
    }

    /* Calculate angle in radians and convert to degrees */
    double angle_rad = acos(cosine);
    return RAD_TO_DEG(angle_rad);
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
