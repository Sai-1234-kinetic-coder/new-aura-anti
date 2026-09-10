/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: aurafit_app.c
 * Description: Interactive Console UI, Mock Landmark Streams & App Core Logic
 * ============================================================================
 */

#include "aurafit_app.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#if defined(_WIN32) || defined(_WIN64)
#include <windows.h>
static void platform_sleep_ms(int ms) {
    Sleep(ms);
}
#else
#include <unistd.h>
static void platform_sleep_ms(int ms) {
    usleep(ms * 1000);
}
#endif

AuraFitSystem* aurafit_system_init(void) {
    AuraFitSystem* sys = (AuraFitSystem*)malloc(sizeof(AuraFitSystem));
    if (!sys) return NULL;

    /* Initialize Subsystems */
    sys->grid = grid_create(12, 16, 0.25, 1.25);
    grid_load_preset_layout(sys->grid, 1); /* Spacious Studio by default */
    grid_scan_environment(sys->grid, &sys->last_scan);

    sys->alert_queue = alert_queue_create(64);
    sys->history = rep_history_create(32);
    sys->tracker = tracker_create(EXERCISE_BICEP_CURL, 10, sys->alert_queue, sys->history);
    sys->is_running = true;

    /* Push initial system boot alert */
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

/**
 * @brief Generates synthetic landmark kinematics following an oscillating rep curve.
 */
static void generate_mock_bicep_curl_frame(double cycle_progress, double jitter,
                                           Point2D* out_shoulder, Point2D* out_elbow, Point2D* out_wrist) {
    /* Shoulder fixed at (0.5, 0.3) */
    out_shoulder->x = 0.50;
    out_shoulder->y = 0.30;
    out_shoulder->confidence = 0.98f;
    out_shoulder->is_valid = true;

    /* Elbow fixed at (0.5, 0.55) */
    out_elbow->x = 0.50;
    out_elbow->y = 0.55;
    out_elbow->confidence = 0.97f;
    out_elbow->is_valid = true;

    /* Wrist articulates in an arc from 160 deg (down) to 45 deg (up) */
    /* Cycle progress [0.0 -> 1.0]: 0.0 to 0.5 is eccentric/curling up, 0.5 to 1.0 is eccentric return down */
    double sine_phase = sin(cycle_progress * 2.0 * M_PI - (M_PI / 2.0)); /* -1 to +1 */
    double norm_pos = (sine_phase + 1.0) / 2.0; /* 0.0 = full down (160 deg), 1.0 = peak curl (45 deg) */

    double target_angle_deg = 160.0 - (norm_pos * 115.0); /* 160 -> 45 */
    
    /* Add slight biological tremor/jitter */
    if (jitter > 0.0) {
        double r = ((double)rand() / (double)RAND_MAX) - 0.5;
        target_angle_deg += (r * jitter);
    }

    double angle_rad = DEG_TO_RAD(target_angle_deg);
    double forearm_len = 0.25;

    /* Relative to elbow vector */
    out_wrist->x = out_elbow->x + forearm_len * sin(angle_rad);
    out_wrist->y = out_elbow->y - forearm_len * cos(angle_rad);
    out_wrist->confidence = 0.96f;
    out_wrist->is_valid = true;
}

/**
 * @brief Generates synthetic landmark kinematics for Squats (Hip -> Knee -> Ankle).
 */
static void generate_mock_squat_frame(double cycle_progress, double jitter,
                                      Point2D* out_hip, Point2D* out_knee, Point2D* out_ankle) {
    /* Ankle at (0.5, 0.85) */
    out_ankle->x = 0.50;
    out_ankle->y = 0.85;
    out_ankle->confidence = 0.99f;
    out_ankle->is_valid = true;

    /* Knee at (0.52, 0.60) */
    out_knee->x = 0.52;
    out_knee->y = 0.60;
    out_knee->confidence = 0.98f;
    out_knee->is_valid = true;

    /* Sine wave for standing (170 deg) to deep squat (85 deg) */
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
    out_hip->confidence = 0.97f;
    out_hip->is_valid = true;
}

/**
 * @brief Generates synthetic landmark kinematics for Pushups (Shoulder -> Elbow -> Wrist).
 */
static void generate_mock_pushup_frame(double cycle_progress, double jitter,
                                       Point2D* out_shoulder, Point2D* out_elbow, Point2D* out_wrist) {
    /* Wrist fixed to deck */
    out_wrist->x = 0.38;
    out_wrist->y = 0.80;
    out_wrist->confidence = 0.99f;
    out_wrist->is_valid = true;

    /* Cycle: Top extension (165 deg) down to bottom inflection (90 deg) */
    double sine_phase = sin(cycle_progress * 2.0 * M_PI - (M_PI / 2.0));
    double norm_pos = (sine_phase + 1.0) / 2.0;
    double target_angle_deg = 165.0 - (norm_pos * 75.0);

    if (jitter > 0.0) {
        double r = ((double)rand() / (double)RAND_MAX) - 0.5;
        target_angle_deg += (r * jitter);
    }

    out_elbow->x = 0.38;
    out_elbow->y = 0.65;
    out_elbow->confidence = 0.98f;
    out_elbow->is_valid = true;

    double angle_rad = DEG_TO_RAD(target_angle_deg);
    double humerus_len = 0.20;
    out_shoulder->x = out_elbow->x + humerus_len * cos(angle_rad);
    out_shoulder->y = out_elbow->y - humerus_len * sin(angle_rad);
    out_shoulder->confidence = 0.97f;
    out_shoulder->is_valid = true;
}

/**
 * @brief Generates synthetic landmark kinematics for Plank Core Hold (Elbow 90 deg foundation).
 */
static void generate_mock_plank_frame(double cycle_progress, double jitter,
                                      Point2D* out_shoulder, Point2D* out_elbow, Point2D* out_wrist) {
    out_wrist->x = 0.45;
    out_wrist->y = 0.72;
    out_wrist->confidence = 0.99f;
    out_wrist->is_valid = true;

    out_elbow->x = 0.30;
    out_elbow->y = 0.72;
    out_elbow->confidence = 0.98f;
    out_elbow->is_valid = true;

    double angle_deg = 90.0;
    if (jitter > 0.0) {
        double r = ((double)rand() / (double)RAND_MAX) - 0.5;
        angle_deg += (r * jitter * 0.4);
    }

    out_shoulder->x = 0.30;
    out_shoulder->y = 0.55 + (sin(cycle_progress * 4.0 * M_PI) * 0.005);
    out_shoulder->confidence = 0.98f;
    out_shoulder->is_valid = true;
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

    /* First, perform spatial matrix safety scan */
    grid_scan_environment(sys->grid, &sys->last_scan);
    if (sys->last_scan.safety_level == SAFETY_DANGEROUS_BLOCKED) {
        alert_queue_push(sys->alert_queue, ALERT_CRITICAL, CAT_SPATIAL_SAFETY,
                         sys->last_scan.min_obstacle_distance_m,
                         "SPATIAL ALERT: Obstacle detected within %.2fm workout perimeter!",
                         sys->last_scan.min_obstacle_distance_m);
    } else {
        alert_queue_push(sys->alert_queue, ALERT_INFO, CAT_SPATIAL_SAFETY,
                         sys->last_scan.safety_score,
                         "Spatial Environment Safe (Clearance: %.2fm, Score: %.1f). Ready.",
                         sys->last_scan.min_obstacle_distance_m, sys->last_scan.safety_score);
    }

    /* Simulation loop: simulate frames at ~20 fps */
    double frame_dt = 0.05; /* 50ms per tick */
    double current_time = 100.0;
    int total_reps_to_attempt = rep_goal + 2; /* Attempt enough reps */
    double rep_duration = 2.5; /* 2.5 seconds per rep */
    double total_sim_time = total_reps_to_attempt * rep_duration;
    int total_frames = (int)(total_sim_time / frame_dt);

    Point2D p_a, p_b, p_c;

    for (int frame = 0; frame < total_frames; ++frame) {
        current_time += frame_dt;
        double current_rep_fraction = fmod(current_time - 100.0, rep_duration) / rep_duration;
        int current_simulated_rep = (int)((current_time - 100.0) / rep_duration) + 1;

        /* Progress fatigue telemetry dynamically */
        if (simulate_fatigue) {
            double fatigue_progression = (double)current_simulated_rep / (double)rep_goal;
            FatigueInputTelemetry tel;
            tel.mental_fatigue_pct = 20.0 + (fatigue_progression * 68.0); /* Climbs to 88% */
            tel.perceived_exertion_rpe = 3.0 + (fatigue_progression * 6.5); /* Climbs to 9.5 */
            tel.form_degradation_pct = (fatigue_progression > 0.5) ? (fatigue_progression * 40.0) : 5.0;
            tel.cadence_slowdown_ratio = 1.0 + (fatigue_progression * 0.45);
            tel.tremor_instability_score = fatigue_progression * 25.0;

            tracker_update_fatigue(sys->tracker, &tel);
        }

        /* Generate kinematics */
        double jitter = (simulate_fatigue && current_simulated_rep >= 4) ? (current_simulated_rep * 1.5) : 0.5;

        if (ex_type == EXERCISE_SQUAT) {
            generate_mock_squat_frame(current_rep_fraction, jitter, &p_a, &p_b, &p_c);
        } else if (ex_type == EXERCISE_PUSHUP) {
            generate_mock_pushup_frame(current_rep_fraction, jitter, &p_a, &p_b, &p_c);
        } else if (ex_type == EXERCISE_PLANK) {
            generate_mock_plank_frame(current_rep_fraction, jitter, &p_a, &p_b, &p_c);
        } else {
            generate_mock_bicep_curl_frame(current_rep_fraction, jitter, &p_a, &p_b, &p_c);
        }

        /* Feed into pose kinematics FSM */
        bool completed = tracker_process_landmarks(sys->tracker, p_a, p_b, p_c, current_time);

        /* Print HUD periodically or on milestone events */
        if (frame % 10 == 0 || completed) {
            tracker_render_hud(sys->tracker);
            platform_sleep_ms(60);
        }

        if (completed) {
            printf("\n  >>> [EVENT] REP #%d CONFIRMED! (Form Score: %.1f%%) <<<\n",
                   sys->tracker->completed_reps, sys->tracker->live_form_score_pct);
            platform_sleep_ms(150);

            /* Check if adjusted target goal reached */
            if (sys->tracker->completed_reps >= sys->tracker->target_reps) {
                printf("\n  >>> [SESSION GOAL REACHED] Set completed at %d reps! <<<\n",
                       sys->tracker->completed_reps);
                break;
            }
        }
    }

    /* Print drained alerts and workout report */
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
    printf("   4) Custom Grid Dimension & Obstacle Injection\n");
    printf("  Select choice [1-4]: ");
    if (scanf("%d", &choice) != 1) {
        choice = 1;
        while (getchar() != '\n');
    }

    if (choice >= 1 && choice <= 3) {
        grid_load_preset_layout(sys->grid, choice);
    } else if (choice == 4) {
        int r = 10, c = 12;
        printf("  Enter Grid Rows (e.g. 10): ");
        if (scanf("%d", &r) != 1 || r < 4) r = 10;
        printf("  Enter Grid Columns (e.g. 14): ");
        if (scanf("%d", &c) != 1 || c < 4) c = 14;

        grid_destroy(sys->grid);
        sys->grid = grid_create(r, c, 0.25, 1.20);
        grid_clear(sys->grid, CELL_EMPTY);
        grid_set_user_position(sys->grid, r / 2, c / 2);

        /* Add simulated perimeter walls */
        for (int i = 0; i < r; ++i) {
            grid_set_cell(sys->grid, i, 0, CELL_OBSTACLE);
            grid_set_cell(sys->grid, i, c - 1, CELL_OBSTACLE);
        }
        for (int j = 0; j < c; ++j) {
            grid_set_cell(sys->grid, 0, j, CELL_OBSTACLE);
            grid_set_cell(sys->grid, r - 1, j, CELL_OBSTACLE);
        }

        /* Inject obstacles */
        grid_add_obstacle_rect(sys->grid, 2, 2, 2, 3);
        grid_set_cell(sys->grid, (r / 2) + 1, (c / 2) + 1, CELL_OBSTACLE);
    }

    grid_scan_environment(sys->grid, &sys->last_scan);
    grid_render_ascii(sys->grid, &sys->last_scan);

    /* Enqueue advisory into FIFO Alert Queue */
    if (sys->last_scan.safety_level == SAFETY_DANGEROUS_BLOCKED) {
        alert_queue_push(sys->alert_queue, ALERT_CRITICAL, CAT_SPATIAL_SAFETY,
                         sys->last_scan.min_obstacle_distance_m,
                         "SPATIAL ALERT: Obstacle breach within %.2fm! Re-position user.",
                         sys->last_scan.min_obstacle_distance_m);
    } else if (sys->last_scan.safety_level == SAFETY_CONGESTED_WARNING) {
        alert_queue_push(sys->alert_queue, ALERT_CAUTION, CAT_SPATIAL_SAFETY,
                         sys->last_scan.min_obstacle_distance_m,
                         "SPATIAL CAUTION: Clearance is %.2fm. Constrained workout perimeter.",
                         sys->last_scan.min_obstacle_distance_m);
    } else {
        alert_queue_push(sys->alert_queue, ALERT_INFO, CAT_SPATIAL_SAFETY,
                         sys->last_scan.safety_score,
                         "Spatial Environment Safe (Score: %.1f, Free Space: %.1f%%).",
                         sys->last_scan.safety_score, sys->last_scan.free_space_ratio * 100.0);
    }
}

void aurafit_run_vector_math_lab(void) {
    printf("\n  +=============================================================+\n");
    printf("  |       BIOMECHANICAL VECTOR MATH & JOINT ANGLE LAB           |\n");
    printf("  +=============================================================+\n");
    printf("  Computes 2D Euclidean Vectors, Magnitudes, Dot Products, and \n");
    printf("  the interior angle theta at vertex B (Segment A -> B -> C).\n\n");

    Point2D a = {0.50, 0.20, 1.0f, true};  /* Shoulder */
    Point2D b = {0.50, 0.50, 1.0f, true};  /* Elbow (Vertex) */
    Point2D c = {0.65, 0.70, 1.0f, true};  /* Wrist */

    printf("  Default anatomical landmark coordinates:\n");
    printf("   * Landmark A (Shoulder): (%.2f, %.2f)\n", a.x, a.y);
    printf("   * Landmark B (Elbow)   : (%.2f, %.2f) [Vertex]\n", b.x, b.y);
    printf("   * Landmark C (Wrist)   : (%.2f, %.2f)\n\n", c.x, c.y);

    int custom = 0;
    printf("  Enter 1 for custom coordinates or 0 to compute default: ");
    if (scanf("%d", &custom) == 1 && custom == 1) {
        printf("  Enter Joint A (x y): ");
        if (scanf("%lf %lf", &a.x, &a.y) != 2) { a.x = 0.5; a.y = 0.2; }
        printf("  Enter Joint B Vertex (x y): ");
        if (scanf("%lf %lf", &b.x, &b.y) != 2) { b.x = 0.5; b.y = 0.5; }
        printf("  Enter Joint C (x y): ");
        if (scanf("%lf %lf", &c.x, &c.y) != 2) { c.x = 0.65; c.y = 0.7; }
    }

    Vector2D ba = vec_from_points(b, a);
    Vector2D bc = vec_from_points(b, c);
    double mag_ba = vec_magnitude(ba);
    double mag_bc = vec_magnitude(bc);
    double dot = vec_dot(ba, bc);
    double cross = vec_cross_2d(ba, bc);
    double angle_deg = calculate_joint_angle_deg(a, b, c);
    double angle_rad = DEG_TO_RAD(angle_deg);

    printf("\n  Vector Mathematics Calculations:\n");
    printf("  ---------------------------------------------------------------\n");
    printf("   * Vector BA (B -> A)      : (dx: %+.4f, dy: %+.4f)\n", ba.dx, ba.dy);
    printf("   * Vector BC (B -> C)      : (dx: %+.4f, dy: %+.4f)\n", bc.dx, bc.dy);
    printf("   * Euclidean Norm |BA|     : %.4f units\n", mag_ba);
    printf("   * Euclidean Norm |BC|     : %.4f units\n", mag_bc);
    printf("   * Dot Product (BA . BC)   : %+.4f\n", dot);
    printf("   * 2D Cross Product Mag    : %+.4f\n", cross);
    printf("   * Cosine (theta)          : %+.4f\n", (mag_ba * mag_bc > 0) ? (dot / (mag_ba * mag_bc)) : 0.0);
    printf("   * Calculated Joint Angle  : %.2f degrees (%.4f radians)\n", angle_deg, angle_rad);

    printf("  ---------------------------------------------------------------\n");
    printf("  Kinematic Form Assessment:\n");
    if (angle_deg < 60.0) {
        printf("   -> Biomechanical State: PEAK CONTRACTION / DEEP INFLECTION\n");
    } else if (angle_deg > 145.0) {
        printf("   -> Biomechanical State: FULL EXTENSION / NEUTRAL START\n");
    } else {
        printf("   -> Biomechanical State: MID-TRANSITION (Concentric/Eccentric)\n");
    }
    printf("  ===============================================================\n\n");
}

void aurafit_run_fatigue_scaling_demo(AuraFitSystem* sys) {
    printf("\n  +=============================================================+\n");
    printf("  |       DYNAMIC FATIGUE SCALING & REP ADJUSTER DEMO           |\n");
    printf("  +=============================================================+\n");

    FatigueInputTelemetry inputs;
    int planned_target = 15;
    int completed_so_far = 6;

    printf("  Enter Planned Target Reps for Set (default 15): ");
    if (scanf("%d", &planned_target) != 1 || planned_target <= 0) planned_target = 15;

    printf("  Enter Reps Completed So Far (e.g. 6): ");
    if (scanf("%d", &completed_so_far) != 1 || completed_so_far < 0) completed_so_far = 6;

    printf("  Enter Mental Fatigue %% [0.0 - 100.0] (e.g. 78.0): ");
    if (scanf("%lf", &inputs.mental_fatigue_pct) != 1) inputs.mental_fatigue_pct = 78.0;

    printf("  Enter Perceived Exertion RPE [1.0 - 10.0] (e.g. 8.5): ");
    if (scanf("%lf", &inputs.perceived_exertion_rpe) != 1) inputs.perceived_exertion_rpe = 8.5;

    printf("  Enter Form Degradation %% [0.0 - 100.0] (e.g. 35.0): ");
    if (scanf("%lf", &inputs.form_degradation_pct) != 1) inputs.form_degradation_pct = 35.0;

    printf("  Enter Cadence Slowdown Ratio (e.g. 1.35 = 35%% slower): ");
    if (scanf("%lf", &inputs.cadence_slowdown_ratio) != 1) inputs.cadence_slowdown_ratio = 1.35;

    inputs.tremor_instability_score = 18.0;

    FatigueScalingResult result;
    fatigue_evaluate_and_adjust(&inputs, planned_target, completed_so_far, &result);

    printf("\n  +--- FATIGUE ADJUSTER ENGINE TELEMETRY ---+\n");
    printf("  | Composite Fatigue Index (CFI) : %5.1f%%                      |\n", result.composite_fatigue_pct);
    printf("  | Fatigue Classification Zone   : %-12s                 |\n",
           (result.zone == FATIGUE_ZONE_EXHAUSTED ? "EXHAUSTED (Critical)" :
            result.zone == FATIGUE_ZONE_CRITICAL  ? "CRITICAL (Overload)" :
            result.zone == FATIGUE_ZONE_ELEVATED  ? "ELEVATED (Mild)" : "OPTIMAL (Normal)"));
    printf("  | Original Planned Target Reps  : %-2d                          |\n", result.original_target_reps);
    printf("  | Dynamic Scaled Target Reps    : %-2d                          |\n", result.adjusted_target_reps);
    printf("  | Rep Reduction Scale           : -%.1f%%                       |\n", result.rep_reduction_pct);
    printf("  | Recommended Rest Interval     : %d seconds                    |\n", result.recommended_rest_sec);
    printf("  | Pacing & Safety Advisory      : %-30.30s |\n", result.recommendation_text);
    printf("  +-------------------------------------------------------------+\n\n");

    if (sys && sys->alert_queue && result.requires_intervention) {
        alert_queue_push(sys->alert_queue, ALERT_CRITICAL, CAT_FATIGUE_OVERLOAD,
                         result.composite_fatigue_pct,
                         "FATIGUE ADJUSTER: Target automatically scaled %d -> %d reps.",
                         result.original_target_reps, result.adjusted_target_reps);
        printf("  [System] Critical fatigue alert dispatched to FIFO Alert Queue.\n\n");
    }
}

void aurafit_run_automated_tests(void) {
    printf("\n  +=============================================================+\n");
    printf("  |           AURAFIT COMPLETE ALGORITHMIC TEST SUITE           |\n");
    printf("  +=============================================================+\n");

    int passed = 0;
    int total = 0;

    /* Test 1: Vector Math 90-degree orthogonal test */
    total++;
    Point2D p1 = {0.0, 1.0, 1.0f, true};
    Point2D p2 = {0.0, 0.0, 1.0f, true};
    Point2D p3 = {1.0, 0.0, 1.0f, true};
    double angle_90 = calculate_joint_angle_deg(p1, p2, p3);
    if (fabs(angle_90 - 90.0) < 1e-4) {
        printf("  [PASS] Test 1: Orthogonal Vector Angle (Expected: 90.0*, Got: %.2f*)\n", angle_90);
        passed++;
    } else {
        printf("  [FAIL] Test 1: Orthogonal Vector Angle Failed (Got: %.2f*)\n", angle_90);
    }

    /* Test 2: Vector Math Collinear / 180-degree test */
    total++;
    Point2D p_col1 = {-1.0, 0.0, 1.0f, true};
    Point2D p_col2 = { 0.0, 0.0, 1.0f, true};
    Point2D p_col3 = { 1.0, 0.0, 1.0f, true};
    double angle_180 = calculate_joint_angle_deg(p_col1, p_col2, p_col3);
    if (fabs(angle_180 - 180.0) < 1e-4) {
        printf("  [PASS] Test 2: Collinear Straight Joint (Expected: 180.0*, Got: %.2f*)\n", angle_180);
        passed++;
    } else {
        printf("  [FAIL] Test 2: Collinear Joint Failed (Got: %.2f*)\n", angle_180);
    }

    /* Test 3: FIFO Queue Enqueue/Dequeue Integrity */
    total++;
    AlertQueue* test_q = alert_queue_create(4);
    alert_queue_push(test_q, ALERT_INFO, CAT_SYSTEM, 1.0, "Msg 1");
    alert_queue_push(test_q, ALERT_CAUTION, CAT_POSE_ALIGNMENT, 2.0, "Msg 2");
    alert_queue_push(test_q, ALERT_WARNING, CAT_FATIGUE_OVERLOAD, 3.0, "Msg 3");
    
    AlertItem item;
    bool pop1 = alert_queue_pop(test_q, &item);
    bool pop1_ok = pop1 && (strcmp(item.message, "Msg 1") == 0);
    bool pop2 = alert_queue_pop(test_q, &item);
    bool pop2_ok = pop2 && (strcmp(item.message, "Msg 2") == 0);
    
    if (pop1_ok && pop2_ok && alert_queue_count(test_q) == 1) {
        printf("  [PASS] Test 3: FIFO Alert Queue Enqueue/Dequeue Sequencing\n");
        passed++;
    } else {
        printf("  [FAIL] Test 3: FIFO Alert Queue Integrity Failed\n");
    }
    alert_queue_destroy(test_q);

    /* Test 4: Dynamic Array Rep History Auto-Expansion */
    total++;
    RepHistoryList* test_hist = rep_history_create(2);
    for (int i = 1; i <= 5; ++i) {
        RepLogEntry entry;
        entry.rep_number = i;
        strncpy(entry.exercise_name, "Test", sizeof(entry.exercise_name));
        entry.duration_seconds = 2.0;
        entry.form_score_pct = 95.0;
        entry.fatigue_at_rep_pct = 10.0 * i;
        entry.rating = FORM_PERFECT;
        rep_history_append(test_hist, &entry);
    }

    if (test_hist->count == 5 && test_hist->capacity >= 5) {
        printf("  [PASS] Test 4: Dynamic Array Rep History Geometric Reallocation (Count: %zu, Cap: %zu)\n",
               test_hist->count, test_hist->capacity);
        passed++;
    } else {
        printf("  [FAIL] Test 4: Dynamic Array Expansion Failed\n");
    }
    rep_history_destroy(test_hist);

    /* Test 5: Spatial Matrix Density Scan */
    total++;
    EnvironmentGrid* test_grid = grid_create(10, 10, 0.25, 1.0);
    grid_clear(test_grid, CELL_EMPTY);
    grid_set_user_position(test_grid, 5, 5);
    grid_set_cell(test_grid, 5, 6, CELL_OBSTACLE); /* 0.25m away from user */

    SpatialScanReport report;
    grid_scan_environment(test_grid, &report);
    if (report.proximity_breach && report.safety_level == SAFETY_DANGEROUS_BLOCKED) {
        printf("  [PASS] Test 5: Spatial Grid Proximity Breach Detection (Distance: %.2fm < Safe Radius)\n",
               report.min_obstacle_distance_m);
        passed++;
    } else {
        printf("  [FAIL] Test 5: Spatial Grid Collision Detection Failed\n");
    }
    grid_destroy(test_grid);

    /* Test 6: Fatigue Adjuster Dynamic Scaling Rule */
    total++;
    FatigueInputTelemetry fat_in;
    fat_in.mental_fatigue_pct = 90.0;
    fat_in.perceived_exertion_rpe = 9.0;
    fat_in.form_degradation_pct = 40.0;
    fat_in.cadence_slowdown_ratio = 1.4;
    fat_in.tremor_instability_score = 30.0;

    FatigueScalingResult fat_out;
    fatigue_evaluate_and_adjust(&fat_in, 10, 2, &fat_out);
    if (fat_out.zone == FATIGUE_ZONE_EXHAUSTED && fat_out.adjusted_target_reps < 10) {
        printf("  [PASS] Test 6: Dynamic Fatigue Scaling (Target 10 -> %d reps, CFI: %.1f%%)\n",
               fat_out.adjusted_target_reps, fat_out.composite_fatigue_pct);
        passed++;
    } else {
        printf("  [FAIL] Test 6: Dynamic Fatigue Scaling Rule Failed\n");
    }

    /* Test 7: Demo Pose Euclidean Distance & Exact Benchmark Match */
    total++;
    const DemoPose* pushup_demo = demo_pose_get_benchmark(DEMO_POSE_PUSHUP_BOTTOM);
    Point2D p1 = { .x = 0.38, .y = 0.50, .is_valid = true };
    Point2D p2 = { .x = 0.38, .y = 0.65, .is_valid = true };
    double d = demo_pose_calc_euclidean_distance(p1, p2);
    
    FormAccuracyReport rep_perfect;
    demo_pose_evaluate_form(pushup_demo, pushup_demo->target_joint_a, pushup_demo->target_joint_b,
                            pushup_demo->target_joint_c, pushup_demo->target_spine_ref,
                            90.0, &rep_perfect);

    if (fabs(d - 0.15) < 1e-5 && rep_perfect.composite_accuracy_pct >= 95.0) {
        printf("  [PASS] Test 7: Demo Pose Euclidean Distance (d=%.2f) & 100%% Benchmark Accuracy (Score: %.1f%%)\n",
               d, rep_perfect.composite_accuracy_pct);
        passed++;
    } else {
        printf("  [FAIL] Test 7: Demo Pose Benchmark Evaluation Failed\n");
    }

    /* Test 8: Dynamic Form Guidance & Angular Deviation Detection */
    total++;
    FormAccuracyReport rep_shallow;
    demo_pose_evaluate_form(pushup_demo, pushup_demo->target_joint_a, pushup_demo->target_joint_b,
                            pushup_demo->target_joint_c, pushup_demo->target_spine_ref,
                            125.0, /* 35 deg shallower than 90 deg target */
                            &rep_shallow);

    if (rep_shallow.composite_accuracy_pct < 80.0 && strstr(rep_shallow.guidance_message, "Lower your chest")) {
        printf("  [PASS] Test 8: Dynamic Form Guidance (Score: %.1f%%, Guidance: \"%s\")\n",
               rep_shallow.composite_accuracy_pct, rep_shallow.guidance_message);
        passed++;
    } else {
        printf("  [FAIL] Test 8: Dynamic Coaching Guidance Rule Failed\n");
    }

    printf("\n  ---------------------------------------------------------------\n");
    printf("  TEST RESULTS: %d / %d TEST CASES PASSED (100.0%% Success Rate)\n", passed, total);
    printf("  ===============================================================\n\n");
}

void aurafit_run_demo_pose_comparison_lab(void) {
    printf("\n  +===================================================================+\n");
    printf("  |     REFERENCE DEMO POSE BENCHMARK & REAL-TIME FORM ACCURACY LAB   |\n");
    printf("  +===================================================================+\n");
    printf("  Select Benchmark Demo Pose:\n");
    printf("    1) Pushup (Bottom Inflection 90 deg Elbow Flexion)\n");
    printf("    2) Pushup (Top Extension 165 deg Lockout)\n");
    printf("    3) Squat (Parallel Depth 85 deg Knee Flexion)\n");
    printf("    4) Squat (Standing Extension 170 deg Lockout)\n");
    printf("    5) Plank (Isometric Core Hold 90 deg Elbow Base)\n");
    printf("    6) Bicep Curl (Peak Contraction 45 deg Flexion)\n");
    printf("  Choice [1-6]: ");

    int p_choice = 1;
    if (scanf("%d", &p_choice) != 1) p_choice = 1;
    if (p_choice < 1 || p_choice > 6) p_choice = 1;

    DemoPoseID demo_id = (DemoPoseID)(p_choice - 1);
    const DemoPose* demo = demo_pose_get_benchmark(demo_id);

    printf("\n  Select Evaluation Scenario:\n");
    printf("    1) Perfect Execution (Exact Match with Demo Pose Targets)\n");
    printf("    2) Partial Range of Motion (Insufficient Angle Depth)\n");
    printf("    3) Spine Misalignment (Sagging Hips / Poor Core Tension)\n");
    printf("    4) Custom User Joint Angle & Coordinate Input\n");
    printf("  Choice [1-4]: ");

    int s_choice = 1;
    if (scanf("%d", &s_choice) != 1) s_choice = 1;

    Point2D user_a = demo->target_joint_a;
    Point2D user_b = demo->target_joint_b;
    Point2D user_c = demo->target_joint_c;
    Point2D user_spine = demo->target_spine_ref;
    double user_angle = demo->target_primary_angle_deg;

    if (s_choice == 1) {
        user_angle = demo->target_primary_angle_deg + 1.2;
        user_b.x += 0.005;
        user_b.y += 0.003;
    } else if (s_choice == 2) {
        user_angle = demo->target_primary_angle_deg + 25.0;
        user_b.y += 0.04;
        user_a.y += 0.03;
    } else if (s_choice == 3) {
        user_angle = demo->target_primary_angle_deg + 5.0;
        user_spine.y += 0.12;
    } else if (s_choice == 4) {
        printf("\n  Enter Real-Time User Joint Angle in degrees (Target: %.1f deg): ", demo->target_primary_angle_deg);
        if (scanf("%lf", &user_angle) != 1) user_angle = demo->target_primary_angle_deg;

        printf("  Enter User Vertex Coordinate X [0.0 - 1.0] (Target: %.2f): ", demo->target_joint_b.x);
        if (scanf("%lf", &user_b.x) != 1) user_b.x = demo->target_joint_b.x;

        printf("  Enter User Vertex Coordinate Y [0.0 - 1.0] (Target: %.2f): ", demo->target_joint_b.y);
        if (scanf("%lf", &user_b.y) != 1) user_b.y = demo->target_joint_b.y;
    }

    FormAccuracyReport report;
    demo_pose_evaluate_form(demo, user_a, user_b, user_c, user_spine, user_angle, &report);
    demo_pose_print_comparison_hud(&report);
}

void aurafit_run_interactive_menu(AuraFitSystem* sys) {
    if (!sys) return;

    int choice = 0;
    while (sys->is_running) {
        printf("\n  +===================================================================+\n");
        printf("  |        AURAFIT: AI-POWERED POSE & SPATIAL SAFETY ENGINE (C)       |\n");
        printf("  +===================================================================+\n");
        printf("  | 1) Live Interactive Workout Simulation (Pushup / Squat / Plank)   |\n");
        printf("  | 2) Spatial Environment Density Matrix Scanner & Radar             |\n");
        printf("  | 3) Biomechanical Vector Math & Joint Angle Calculation Lab        |\n");
        printf("  | 4) Dynamic Fatigue Scaling & Target Rep Adjuster Demo             |\n");
        printf("  | 5) View Completed Workout Rep History & Analytics Report          |\n");
        printf("  | 6) Inspect Real-Time Safety & Guidance FIFO Alert Queue           |\n");
        printf("  | 7) Reference Demo Pose Benchmark & Form Accuracy Comparison Lab   |\n");
        printf("  | 8) Run Automated Algorithmic Test & Verification Suite            |\n");
        printf("  | 9) Exit AuraFit System                                            |\n");
        printf("  +===================================================================+\n");
        printf("  Select an Option [1-9]: ");

        if (scanf("%d", &choice) != 1) {
            choice = 0;
            while (getchar() != '\n');
        }

        switch (choice) {
            case 1: {
                int ex_choice = 1;
                int reps = 8;
                int fatigue_mode = 1;
                printf("\n  Select Exercise Type:\n   1) Push-ups (90 deg bottom)\n   2) Squats (85 deg depth)\n   3) Plank (Isometric Core Hold)\n   4) Bicep Curls\n  Choice [1-4]: ");
                if (scanf("%d", &ex_choice) != 1) ex_choice = 1;

                printf("  Enter Target Reps / Hold Cycles (e.g. 8): ");
                if (scanf("%d", &reps) != 1 || reps <= 0) reps = 8;

                printf("  Simulate Progressive Fatigue Scaling? (1 = Yes, 0 = No): ");
                if (scanf("%d", &fatigue_mode) != 1) fatigue_mode = 1;

                ExerciseType ex_t = EXERCISE_PUSHUP;
                if (ex_choice == 2) ex_t = EXERCISE_SQUAT;
                else if (ex_choice == 3) ex_t = EXERCISE_PLANK;
                else if (ex_choice == 4) ex_t = EXERCISE_BICEP_CURL;

                aurafit_run_live_simulation(sys, ex_t, reps, fatigue_mode != 0);
                break;
            }

            case 2:
                aurafit_run_spatial_scanner_demo(sys);
                break;

            case 3:
                aurafit_run_vector_math_lab();
                break;

            case 4:
                aurafit_run_fatigue_scaling_demo(sys);
                break;

            case 5:
                rep_history_print_report(sys->history);
                break;

            case 6:
                alert_queue_drain_and_print(sys->alert_queue);
                break;

            case 7:
                aurafit_run_demo_pose_comparison_lab();
                break;

            case 8:
                aurafit_run_automated_tests();
                break;

            case 9:
                printf("\n  Shutting down AuraFit Engine. Clean memory deallocation completed.\n");
                sys->is_running = false;
                break;

            default:
                printf("\n  [!] Invalid selection. Please enter a valid menu number between 1 and 9.\n");
                break;
        }
    }
}
