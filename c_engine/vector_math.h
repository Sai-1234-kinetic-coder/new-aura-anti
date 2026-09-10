/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: vector_math.h
 * Description: 2D Euclidean Vector Math, Point Operations & Joint Angle Engine
 * ============================================================================
 */

#ifndef AURAFIT_VECTOR_MATH_H
#define AURAFIT_VECTOR_MATH_H

#include <stdbool.h>
#include <math.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#define RAD_TO_DEG(radians) ((radians) * (180.0 / M_PI))
#define DEG_TO_RAD(degrees) ((degrees) * (M_PI / 180.0))

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Represents a 2D Cartesian coordinate for anatomical pose keypoints.
 */
typedef struct {
    double x;           /**< Normalized or pixel X coordinate */
    double y;           /**< Normalized or pixel Y coordinate */
    float confidence;   /**< Landmark detection confidence [0.0 - 1.0] */
    bool is_valid;      /**< Flag indicating if coordinate data is tracked */
} Point2D;

/**
 * @brief 2D Vector representation for directional kinematic segments.
 */
typedef struct {
    double dx;          /**< Delta X */
    double dy;          /**< Delta Y */
} Vector2D;

/**
 * @brief Landmark collection representing standard human kinetic joints.
 */
typedef struct {
    Point2D nose;
    Point2D left_shoulder;
    Point2D right_shoulder;
    Point2D left_elbow;
    Point2D right_elbow;
    Point2D left_wrist;
    Point2D right_wrist;
    Point2D left_hip;
    Point2D right_hip;
    Point2D left_knee;
    Point2D right_knee;
    Point2D left_ankle;
    Point2D right_ankle;
    unsigned long long timestamp_ms; /**< Timestamp in milliseconds */
} PoseLandmarks;

/**
 * @brief Exponential Moving Average (EMA) Angle Filter for Jitter Reduction.
 */
typedef struct {
    double alpha;               /**< Smoothing factor [0.0 = max smooth, 1.0 = raw] */
    double filtered_angle;      /**< Current smoothed angle */
    bool is_initialized;        /**< First frame indicator */
} AngleSmoother;

/* --- Vector Math Utility Functions --- */

/**
 * @brief Constructs a 2D vector directed from point `from` to point `to`.
 */
static inline Vector2D vec_from_points(Point2D from, Point2D to) {
    Vector2D v;
    v.dx = to.x - from.x;
    v.dy = to.y - from.y;
    return v;
}

/**
 * @brief Calculates Euclidean norm (magnitude / length) of a vector.
 */
static inline double vec_magnitude(Vector2D v) {
    return sqrt((v.dx * v.dx) + (v.dy * v.dy));
}

/**
 * @brief Computes Euclidean distance between two 2D points.
 */
static inline double point_distance(Point2D p1, Point2D p2) {
    double dx = p2.x - p1.x;
    double dy = p2.y - p1.y;
    return sqrt((dx * dx) + (dy * dy));
}

/**
 * @brief Computes the dot product (scalar product) of two vectors.
 */
static inline double vec_dot(Vector2D v1, Vector2D v2) {
    return (v1.dx * v2.dx) + (v1.dy * v2.dy);
}

/**
 * @brief Computes 2D cross product magnitude (v1.dx * v2.dy - v1.dy * v2.dx).
 */
static inline double vec_cross_2d(Vector2D v1, Vector2D v2) {
    return (v1.dx * v2.dy) - (v1.dy * v2.dx);
}

/**
 * @brief Calculates the 2D interior joint angle theta (in degrees) formed at vertex B.
 *        Joint segment configuration: A -> B (vertex) -> C.
 * 
 * @param a First landmark (e.g., Shoulder / Hip)
 * @param b Vertex landmark (e.g., Elbow / Knee)
 * @param c Third landmark (e.g., Wrist / Ankle)
 * @return Angle in degrees in range [0.0, 180.0]. Returns 0.0 on degenerate input.
 */
double calculate_joint_angle_deg(Point2D a, Point2D b, Point2D c);

/**
 * @brief Initializes an Exponential Moving Average filter for angle smoothing.
 */
void angle_smoother_init(AngleSmoother* smoother, double alpha);

/**
 * @brief Updates the angle smoother with a raw angle measurement.
 */
double angle_smoother_update(AngleSmoother* smoother, double raw_angle);

#ifdef __cplusplus
}
#endif

#endif /* AURAFIT_VECTOR_MATH_H */
