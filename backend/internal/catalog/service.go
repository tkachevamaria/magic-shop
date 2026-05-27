package catalog

import "context"

type ProductRepoInterface interface {
	GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error)
}

type ProductService struct {
	repo ProductRepoInterface
}

func NewProductService(repo ProductRepoInterface) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	return s.repo.GetProducts(ctx, filter)
}