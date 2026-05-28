package catalog

import "context"

type ProductRepoInterface interface {
	GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error)
	GetDarkProducts(ctx context.Context, filter ProductFilter) ([]Product, error)
	GetProductByID(ctx context.Context, id int) (*ProductDetail, error)
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

func (s *ProductService) GetDarkProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	return s.repo.GetDarkProducts(ctx, filter)
}

func (s *ProductService) GetProductByID(ctx context.Context, id int) (*ProductDetail, error) {
	return s.repo.GetProductByID(ctx, id)
}