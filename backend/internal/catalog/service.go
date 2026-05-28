package catalog

import "context"

// Интерфейс репозитория (обновлён: добавлен SearchProducts)
type ProductRepoInterface interface {
	GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error)
	GetDarkProducts(ctx context.Context, filter ProductFilter) ([]Product, error)
	GetProductByID(ctx context.Context, id int) (*ProductDetail, error)
	SearchProducts(ctx context.Context, query string, pagination PaginationParams) ([]Product, error)
}

// ProductService делегирует вызовы репозиторию
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

//  Новый метод для поиска
func (s *ProductService) SearchProducts(ctx context.Context, query string, pagination PaginationParams) ([]Product, error) {
	return s.repo.SearchProducts(ctx, query, pagination)
}