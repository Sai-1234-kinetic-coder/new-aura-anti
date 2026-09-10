# ==============================================================================
# AURAFIT C ENGINE MAKEFILE (Modular & Standalone Targets)
# ==============================================================================

CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -std=c99 -pedantic
LDFLAGS ?= -lm

MODULE_SRCS = main.c aurafit_app.c demo_pose.c vector_math.c spatial_matrix.c alert_queue.c rep_history.c fatigue_engine.c exercise_tracker.c
STANDALONE_SRC = aurafit_standalone.c

all: aurafit_modular aurafit_standalone

aurafit_modular: $(MODULE_SRCS)
	$(CC) $(CFLAGS) $(MODULE_SRCS) -o aurafit_modular $(LDFLAGS)

aurafit_standalone: $(STANDALONE_SRC)
	$(CC) $(CFLAGS) $(STANDALONE_SRC) -o aurafit $(LDFLAGS)

test: aurafit_standalone
	./aurafit --test

clean:
	rm -f aurafit aurafit_modular aurafit.exe aurafit_modular.exe *.o

.PHONY: all test clean
