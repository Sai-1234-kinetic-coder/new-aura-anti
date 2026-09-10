/**
 * ============================================================================
 * AURAFIT AI-POWERED ENVIRONMENT SAFETY & EXERCISE POSE SYSTEM
 * Module: alert_queue.h
 * Description: FIFO Queue Data Structure for Real-Time Safety & Form Alerts
 * ============================================================================
 */

#ifndef AURAFIT_ALERT_QUEUE_H
#define AURAFIT_ALERT_QUEUE_H

#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Alert Severity Priority */
typedef enum {
    ALERT_INFO = 0,
    ALERT_CAUTION,
    ALERT_WARNING,
    ALERT_CRITICAL
} AlertPriority;

/* System Component Alert Categories */
typedef enum {
    CAT_SPATIAL_SAFETY = 0,
    CAT_POSE_ALIGNMENT,
    CAT_FATIGUE_OVERLOAD,
    CAT_CADENCE_PACING,
    CAT_SYSTEM
} AlertCategory;

/**
 * @brief Safety Alert & Guidance Data Packet.
 */
typedef struct {
    unsigned long id;
    unsigned long long timestamp_ms;
    AlertPriority priority;
    AlertCategory category;
    char message[160];
    double metric_value;
} AlertItem;

/**
 * @brief Circular FIFO Queue with dynamic contiguous buffer backing.
 */
typedef struct {
    AlertItem* buffer;
    size_t capacity;
    size_t head;       /**< Read index */
    size_t tail;       /**< Write index */
    size_t count;      /**< Current items in queue */
    unsigned long next_id;
} AlertQueue;

/* --- Queue API Prototypes --- */

/**
 * @brief Allocates and initializes a FIFO Alert Queue with the given capacity.
 */
AlertQueue* alert_queue_create(size_t capacity);

/**
 * @brief Destroys the queue and releases underlying memory.
 */
void alert_queue_destroy(AlertQueue* q);

/**
 * @brief Checks if the queue contains zero elements.
 */
bool alert_queue_is_empty(const AlertQueue* q);

/**
 * @brief Checks if the queue has reached full capacity.
 */
bool alert_queue_is_full(const AlertQueue* q);

/**
 * @brief Returns the current number of queued alerts.
 */
size_t alert_queue_count(const AlertQueue* q);

/**
 * @brief Enqueues a new alert packet into the tail of the FIFO queue.
 *        If full, auto-evicts oldest item (ring-buffer mode) to ensure real-time telemetry.
 */
bool alert_queue_push(AlertQueue* q, AlertPriority priority, AlertCategory category,
                      double metric_val, const char* message_fmt, ...);

/**
 * @brief Pops (dequeues) the oldest alert from the head of the queue.
 */
bool alert_queue_pop(AlertQueue* q, AlertItem* out_item);

/**
 * @brief Peeks at the head of the queue without removing it.
 */
bool alert_queue_peek(const AlertQueue* q, AlertItem* out_item);

/**
 * @brief Clears all queued alerts.
 */
void alert_queue_clear(AlertQueue* q);

/**
 * @brief Drains and prints all queued alerts with formatted timestamp & priority tags.
 */
void alert_queue_drain_and_print(AlertQueue* q);

#ifdef __cplusplus
}
#endif

#endif /* AURAFIT_ALERT_QUEUE_H */
