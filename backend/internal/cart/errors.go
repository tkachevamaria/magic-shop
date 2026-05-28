package cart

import "errors"

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrItemNotFound      = errors.New("item not found")
	ErrItemNotInCart     = errors.New("item not in cart")
	ErrInsufficientStock = errors.New("insufficient stock")
	ErrCartNotFound      = errors.New("cart not found")
)
