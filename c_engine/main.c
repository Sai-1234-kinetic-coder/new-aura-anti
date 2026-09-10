/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: main.c
 * Description: Entry point for the AuraFit C Console Application
 * ============================================================================
 */

#include "aurafit_app.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char* argv[]) {
    /* If --test flag passed, execute automated tests directly */
    if (argc > 1 && strcmp(argv[1], "--test") == 0) {
        aurafit_run_automated_tests();
        return 0;
    }

    /* Initialize full AuraFit state */
    AuraFitSystem* sys = aurafit_system_init();
    if (!sys) {
        fprintf(stderr, "Error: Failed to allocate AuraFit system subsystems.\n");
        return 1;
    }

    /* Launch interactive user menu */
    aurafit_run_interactive_menu(sys);

    /* Clean deallocation */
    aurafit_system_shutdown(sys);
    return 0;
}
