package cart

import (
	"context"
	"database/sql"
	"log"
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

	if err == sql.ErrNoRows {
		return 0, ErrUserNotFound
	}

	return cartID, nil
}

func (r *Repo) GetCart(ctx context.Context, userID int) (*Cart, error) {
	var exists int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM Users WHERE UserID = ?`, userID).Scan(&exists)
	if err != nil {
		log.Println("[ERROR] checking user exists:", err)
		return nil, err
	}
	if exists == 0 {
		log.Println("[ERROR] user not found")
		return nil, ErrUserNotFound
	}

	var cart Cart
	err = r.db.QueryRowContext(
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
		log.Println("[ERROR] getting cart:", err)
		return nil, err
	}

	query := `
		SELECT
			ci.CartItemID,
			ci.ItemID,
			p.ProductName,
			p.ImageURL,
			i.Color,
			i.Size,
			p.Price,
			ci.Quantity,
			p.CategoryID
		FROM CartItems ci
		JOIN Items i ON ci.ItemID = i.ItemID
		JOIN Products p ON i.ProductID = p.ProductID
		WHERE ci.CartID = ?
	`

	rows, err := r.db.QueryContext(ctx, query, cart.CartID)
	if err != nil {
		log.Println("[ERROR] query failed:", err)
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
			&item.ImageURL,
			&item.Color,
			&item.Size,
			&item.Price,
			&item.Quantity,
			&item.CategoryID,
		)
		if err != nil {
			log.Println("[ERROR] scanning row:", err)
			return nil, err
		}
		cart.Items = append(cart.Items, item)
	}

	if err := rows.Err(); err != nil {
		log.Println("[ERROR] rows error:", err)
		return nil, err
	}

	return &cart, nil
}

func (r *Repo) IncrementItem(ctx context.Context, cartID, userID, itemID int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Блокируем строку товара на чтение+запись (SQLite: SELECT ... FOR UPDATE не нужен, но BEGIN уже держит lock)
	var stock, requiredLevel int
	err = tx.QueryRowContext(ctx,
		`SELECT i.StockQuantity, p.RequiredLevel FROM Items i
		 JOIN Products p ON i.ProductID = p.ProductID
		 WHERE i.ItemID = ?`, itemID).Scan(&stock, &requiredLevel)
	if err == sql.ErrNoRows {
		return ErrItemNotFound
	}
	if err != nil {
		return err
	}

	// 2. Проверяем уровень
	var userAccessLevel int
	err = tx.QueryRowContext(ctx, `SELECT AccessLevel FROM Users WHERE UserID = ?`, userID).Scan(&userAccessLevel)
	if err == sql.ErrNoRows {
		return ErrUserNotFound
	}
	if err != nil {
		return err
	}
	if userAccessLevel < requiredLevel {
		return ErrAccessDenied
	}

	// 3. Проверяем текущее кол-во в корзине
	var inCart int
	err = tx.QueryRowContext(ctx,
		`SELECT COALESCE(Quantity, 0) FROM CartItems WHERE CartID = ? AND ItemID = ?`, cartID, itemID).Scan(&inCart)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if inCart+1 > stock {
		return ErrInsufficientStock
	}

	// 4. Вставляем или обновляем
	_, err = tx.ExecContext(ctx,
		`INSERT INTO CartItems (CartID, ItemID, Quantity)
		 VALUES (?, ?, 1)
		 ON CONFLICT(CartID, ItemID) DO UPDATE SET Quantity = Quantity + 1`,
		cartID, itemID,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *Repo) DecrementItem(ctx context.Context, cartID, itemID int) error {
	result, err := r.db.ExecContext(ctx,
		`UPDATE CartItems SET Quantity = Quantity - 1
		 WHERE CartID = ? AND ItemID = ?`, cartID, itemID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrItemNotInCart
	}
	_, err = r.db.ExecContext(ctx,
		`DELETE FROM CartItems WHERE CartID = ? AND ItemID = ? AND Quantity <= 0`,
		cartID, itemID)
	return err
}

func (r *Repo) DeleteItem(ctx context.Context, cartID, itemID int) error {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM CartItems WHERE CartID = ? AND ItemID = ?`, cartID, itemID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrItemNotInCart
	}
	return nil
}
