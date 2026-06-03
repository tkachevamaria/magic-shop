package orders

import (
	"context"
	"log"
	"time"
)

func (r *Repo) StartDeliveryWorker(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Сразу при старте, не ждём первого тика
	if n, err := r.markDeliveredOrders(ctx); err != nil {
		log.Printf("[delivery worker] ошибка при старте: %v", err)
	} else if n > 0 {
		log.Printf("[delivery worker] помечено доставленными при старте: %d", n)
	}

	for {
		select {
		case <-ticker.C:
			n, err := r.markDeliveredOrders(ctx)
			if err != nil {
				log.Printf("[delivery worker] ошибка: %v", err)
			} else if n > 0 {
				log.Printf("[delivery worker] помечено доставленными: %d", n)
			}
		case <-ctx.Done():
			log.Println("[delivery worker] остановлен")
			return
		}
	}
}

func (r *Repo) markDeliveredOrders(ctx context.Context) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		UPDATE Orders
		SET    Status             = 'DELIVERED',
		       ActualDeliveryDate = datetime('now')
		WHERE  Status != 'DELIVERED'
		  AND  EstimatedDeliveryDate IS NOT NULL
		  AND  EstimatedDeliveryDate <= datetime('now')
	`)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}
