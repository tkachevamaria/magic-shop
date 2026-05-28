package cart

import "context"

type Service struct {
	repo *Repo
}

func NewService(repo *Repo) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetCart(ctx context.Context, userID int) (*Cart, error) {
	return s.repo.GetCart(ctx, userID)
}

func (s *Service) IncrementItem(ctx context.Context, userID, itemID int) error {
	cartID, err := s.repo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}

	return s.repo.IncrementItem(ctx, cartID, userID, itemID)
}

func (s *Service) DecrementItem(ctx context.Context, userID, itemID int) error {
	cartID, err := s.repo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}

	return s.repo.DecrementItem(ctx, cartID, itemID)
}

func (s *Service) DeleteItem(ctx context.Context, userID, itemID int) error {
	cartID, err := s.repo.GetOrCreateCart(ctx, userID)
	if err != nil {
		return err
	}

	return s.repo.DeleteItem(ctx, cartID, itemID)
}
