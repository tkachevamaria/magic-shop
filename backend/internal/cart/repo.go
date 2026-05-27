package cart

import (
	"context"
	"database/sql"
)

type Repo struct {
	db *sql.DB
}

func NewRepo(db *sql.DB) *Repo {
	return &Repo{db: db}
}

// получить или создать корзину для пользователя
func (r *Repo) GetOrCreateCart(ctx context.Context, userID int) (int, error) {
	_, err := r.db.ExecContext(
		ctx,
		`INSERT OR IGNORE INTO Cart (UserID) VALUES (?)`,
		userID,
	)
	if err != nil {
		return 0, err
	}

	var cartID int

	err = r.db.QueryRowContext(
		ctx,
		`SELECT CartID FROM Cart WHERE UserID = ?`,
		userID,
	).Scan(&cartID)

	if err != nil {
		return 0, err
	}

	return cartID, nil
}

func (r *Repo) GetCart(ctx context.Context, userID int) (*Cart, error) {
	var cart Cart

	err := r.db.QueryRowContext(
		ctx,
		`SELECT CartID, UserID
		 FROM Cart
		 WHERE UserID = ?`,
		userID,
	).Scan(&cart.CartID, &cart.UserID)

	if err == sql.ErrNoRows {
		return &Cart{
			UserID: userID,
			Items:  []CartItem{},
		}, nil
	}

	if err != nil {
		return nil, err
	}

	rows, err := r.db.QueryContext(
		ctx,
		`
		SELECT
			ci.CartItemID,
			ci.ItemID,
			p.ProductName,
			i.Color,
			i.Size,
			p.Price,
			ci.Quantity
		FROM CartItems ci
		JOIN Items i ON ci.ItemID = i.ItemID
		JOIN Products p ON i.ProductID = p.ProductID
		WHERE ci.CartID = ?
		`,
		cart.CartID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cart.Items = []CartItem{}

	for rows.Next() {
		var item CartItem

		err := rows.Scan(
			&item.CartItemID,
			&item.ItemID,
			&item.ProductName,
			&item.Color,
			&item.Size,
			&item.Price,
			&item.Quantity,
		)
		if err != nil {
			return nil, err
		}

		cart.Items = append(cart.Items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &cart, nil
}

func (r *Repo) IncrementItem(ctx context.Context, cartID, itemID int) error {
	_, err := r.db.ExecContext(
		ctx,
		`
		INSERT INTO CartItems (CartID, ItemID, Quantity)
		VALUES (?, ?, 1)
		ON CONFLICT(CartID, ItemID)
		DO UPDATE SET Quantity = Quantity + 1
		`,
		cartID,
		itemID,
	)

	return err
}

func (r *Repo) DecrementItem(ctx context.Context, cartID, itemID int) error {
	result, err := r.db.ExecContext(
		ctx,
		`
		UPDATE CartItems
		SET Quantity = Quantity - 1
		WHERE CartID = ?
		  AND ItemID = ?
		  AND Quantity > 1
		`,
		cartID,
		itemID,
	)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected > 0 {
		return nil
	}

	_, err = r.db.ExecContext(
		ctx,
		`
		DELETE FROM CartItems
		WHERE CartID = ?
		  AND ItemID = ?
		  AND Quantity = 1
		`,
		cartID,
		itemID,
	)

	return err
}

func (r *Repo) DeleteItem(ctx context.Context, cartID, itemID int) error {
	_, err := r.db.ExecContext(
		ctx,
		`
		DELETE FROM CartItems
		WHERE CartID = ?
		  AND ItemID = ?
		`,
		cartID,
		itemID,
	)

	return err
}
