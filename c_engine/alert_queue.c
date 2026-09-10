/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: alert_queue.c
 * Description: FIFO Queue Implementation with Circular Ring Buffer
 * ============================================================================
 */

#include "alert_queue.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include <time.h>

AlertQueue* alert_queue_create(size_t capacity) {
    if (capacity == 0) capacity = 32;

    AlertQueue* q = (AlertQueue*)malloc(sizeof(AlertQueue));
    if (!q) return NULL;

    q->buffer = (AlertItem*)calloc(capacity, sizeof(AlertItem));
    if (!q->buffer) {
        free(q);
        return NULL;
    }

    q->capacity = capacity;
    q->head = 0;
    q->tail = 0;
    q->count = 0;
    q->next_id = 1;
    return q;
}

void alert_queue_destroy(AlertQueue* q) {
    if (q) {
        if (q->buffer) {
            free(q->buffer);
            q->buffer = NULL;
        }
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

    /* If queue is full, evict oldest element at head to accommodate new real-time alert */
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

    if (out_item) {
        *out_item = q->buffer[q->head];
    }

    q->head = (q->head + 1) % q->capacity;
    q->count--;
    return true;
}

bool alert_queue_peek(const AlertQueue* q, AlertItem* out_item) {
    if (alert_queue_is_empty(q)) return false;

    if (out_item) {
        *out_item = q->buffer[q->head];
    }
    return true;
}

void alert_queue_clear(AlertQueue* q) {
    if (!q) return;
    q->head = 0;
    q->tail = 0;
    q->count = 0;
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
        const char* prio_tag = "INFO";
        switch (item.priority) {
            case ALERT_INFO:     prio_tag = "[INFO]    "; break;
            case ALERT_CAUTION:  prio_tag = "[CAUTION] "; break;
            case ALERT_WARNING:  prio_tag = "[WARNING] "; break;
            case ALERT_CRITICAL: prio_tag = "[CRITICAL]"; break;
        }

        const char* cat_tag = "SYS";
        switch (item.category) {
            case CAT_SPATIAL_SAFETY:   cat_tag = "SPATIAL"; break;
            case CAT_POSE_ALIGNMENT:   cat_tag = "FORM   "; break;
            case CAT_FATIGUE_OVERLOAD: cat_tag = "FATIGUE"; break;
            case CAT_CADENCE_PACING:   cat_tag = "CADENCE"; break;
            case CAT_SYSTEM:           cat_tag = "SYSTEM "; break;
        }

        printf("  #%02d | %s | %s | %s\n", idx++, prio_tag, cat_tag, item.message);
    }
    printf("  +--------------------------------------------------------------------+\n\n");
}
