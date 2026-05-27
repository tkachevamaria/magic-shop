package catalog

import "context"

// Интерфейс нужен для тестирования и гибкости
type ProductRepoInterface interface {
	GetAll(ctx context.Context) ([]Product, error)
}

type ProductService struct {
	repo ProductRepoInterface
}

func NewProductService(repo ProductRepoInterface) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) GetAllProducts(ctx context.Context) ([]Product, error) {
	return s.repo.GetAll(ctx)
}