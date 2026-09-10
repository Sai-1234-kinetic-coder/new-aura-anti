cmake_minimum_required(VERSION 3.10)
project(AuraFitEngine C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Modular build
add_executable(aurafit_modular
    main.c
    aurafit_app.c
    vector_math.c
    spatial_matrix.c
    alert_queue.c
    rep_history.c
    fatigue_engine.c
    exercise_tracker.c
)

if(UNIX)
    target_link_libraries(aurafit_modular m)
endif()

# Standalone single-file build
add_executable(aurafit
    aurafit_standalone.c
)

if(UNIX)
    target_link_libraries(aurafit m)
endif()
