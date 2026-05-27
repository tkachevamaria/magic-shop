package cart

import "database/sql"

type Repo struct {
	db *sql.DB
}

func NewRepo(db *sql.DB) *Repo {
	return &Repo{db: db}
}

// получить или создать корзину для пользователя
func (r *Repo) GetOrCreateCart(userID int) (int, error) {
	var cartID int
	err := r.db.QueryRow("SELECT CartID FROM Cart WHERE UserID = ?", userID).Scan(&cartID)
	if err == sql.ErrNoRows {
		res, err := r.db.Exec("INSERT INTO Cart (UserID) VALUES (?)", userID)
		if err != nil {
			return 0, err
		}
		id, _ := res.LastInsertId()
		return int(id), nil
	}
	return cartID, err
}

func (r *Repo) GetCartItems(userID int) (*Cart, error) {
	var cart Cart
	err := r.db.QueryRow("SELECT CartID, UserID FROM Cart WHERE UserID = ?", userID).
		Scan(&cart.CartID, &cart.UserID)
	if err == sql.ErrNoRows {
		return &Cart{UserID: userID, Items: []CartItem{}}, nil
	}
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(`
        SELECT ci.CartItemID, ci.ItemID, p.ProductName, i.Color, i.Size, p.Price, ci.Quantity
        FROM CartItems ci
        JOIN Items i ON ci.ItemID = i.ItemID
        JOIN Products p ON i.ProductID = p.ProductID
        WHERE ci.CartID = ?`, cart.CartID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item CartItem
		rows.Scan(&item.CartItemID, &item.ItemID, &item.ProductName, &item.Color, &item.Size, &item.Price, &item.Quantity)
		cart.Items = append(cart.Items, item)
	}
	if cart.Items == nil {
		cart.Items = []CartItem{}
	}
	return &cart, nil
}

func (r *Repo) IncrementItem(cartID, itemID int) error {
	_, err := r.db.Exec(`
        INSERT INTO CartItems (CartID, ItemID, Quantity)
        VALUES (?, ?, 1)
        ON CONFLICT(CartID, ItemID) DO UPDATE SET Quantity = Quantity + 1`,
		cartID, itemID)
	return err
}

func (r *Repo) DecrementItem(cartID, itemID int) error {
	// Пытаемся уменьшить
	result, err := r.db.Exec(`
        UPDATE CartItems 
        SET Quantity = Quantity - 1 
        WHERE CartID = ? AND ItemID = ? AND Quantity > 1`,
		cartID, itemID)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		// Если Quantity было 1, удаляем запись
		_, err = r.db.Exec(`
            DELETE FROM CartItems 
            WHERE CartID = ? AND ItemID = ? AND Quantity = 1`,
			cartID, itemID)
	}
	return err
}

func (r *Repo) DeleteItem(cartID, itemID int) error {
	_, err := r.db.Exec(`
        DELETE FROM CartItems 
        WHERE CartID = ? AND ItemID = ?`,
		cartID, itemID)
	return err
}
