package cart

type Service struct {
	repo *Repo
}

func NewService(repo *Repo) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetCart(userID int) (*Cart, error) {
	return s.repo.GetCartItems(userID)
}

func (s *Service) IncrementItem(userID, itemID int) error {
	cartID, err := s.repo.GetOrCreateCart(userID)
	if err != nil {
		return err
	}
	return s.repo.IncrementItem(cartID, itemID)
}

func (s *Service) DecrementItem(userID, itemID int) error {
	cartID, err := s.repo.GetOrCreateCart(userID)
	if err != nil {
		return err
	}
	return s.repo.DecrementItem(cartID, itemID)
}

func (s *Service) DeleteItem(userID, itemID int) error {
	cartID, err := s.repo.GetOrCreateCart(userID)
	if err != nil {
		return err
	}
	return s.repo.DeleteItem(cartID, itemID)
}
