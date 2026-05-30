package orders

import "context"

type Service struct {
	repo *Repo
}

func NewService(repo *Repo) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetActiveOrders(ctx context.Context, userID int) ([]OrderSummary, error) {
	return s.repo.GetActiveOrders(ctx, userID)
}

func (s *Service) GetPurchases(ctx context.Context, userID int) ([]OrderSummary, error) {
	return s.repo.GetPurchases(ctx, userID)
}

func (s *Service) GetOrderDetails(ctx context.Context, orderID int) (*OrderDetails, error) {
	return s.repo.GetOrderDetails(ctx, orderID)
}