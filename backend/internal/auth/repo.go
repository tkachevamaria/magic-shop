package auth

import "database/sql"

type Repo struct {
	db *sql.DB
}

func NewRepo(db *sql.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) CreateUser(firstName, surname, email, passwordHash string, accessLevel int) error {
	_, err := r.db.Exec(`
        INSERT INTO Users (FirstName, Surname, Email, PasswordHash, AccessLevel)
        VALUES (?, ?, ?, ?, ?)`,
		firstName, surname, email, passwordHash, accessLevel,
	)
	return err
}

func (r *Repo) GetByEmail(email string) (*User, string, error) {
	var u User
	var hash string
	err := r.db.QueryRow(`
        SELECT UserID, FirstName, Surname, Email, PasswordHash, AccessLevel, TotalSpent
        FROM Users WHERE Email = ?`, email,
	).Scan(&u.UserID, &u.FirstName, &u.Surname, &u.Email, &hash, &u.AccessLevel, &u.TotalSpent)
	if err != nil {
		return nil, "", err
	}
	return &u, hash, nil
}

func (r *Repo) DeleteUser(userID int) error {
	_, err := r.db.Exec("DELETE FROM Users WHERE UserID = ?", userID)
	return err
}
