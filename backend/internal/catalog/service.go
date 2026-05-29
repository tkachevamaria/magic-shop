package catalog

import "context"

type ProductRepoInterface interface {
	GetProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error)
	GetDarkProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error)
	GetProductByID(ctx context.Context, id int) (*ProductDetail, error)
	SearchProducts(ctx context.Context, query string, filter ProductFilter) (CatalogResponse, error)
	GetSidebarFilters(ctx context.Context) (SidebarFilter, error)
}

type ProductService struct {
	repo ProductRepoInterface
}

func NewProductService(repo ProductRepoInterface) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) GetProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error) {
	return s.repo.GetProducts(ctx, filter)
}

func (s *ProductService) GetDarkProducts(ctx context.Context, filter ProductFilter) (CatalogResponse, error) {
	return s.repo.GetDarkProducts(ctx, filter)
}

func (s *ProductService) SearchProducts(ctx context.Context, query string, filter ProductFilter) (CatalogResponse, error) {
	return s.repo.SearchProducts(ctx, query, filter)
}

func (s *ProductService) GetProductByID(ctx context.Context, id int) (*ProductDetail, error) {
	return s.repo.GetProductByID(ctx, id)
}

func (s *ProductService) GetSidebarFilters(ctx context.Context) (SidebarFilter, error) {
	return s.repo.GetSidebarFilters(ctx)
}