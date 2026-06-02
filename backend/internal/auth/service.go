package auth

import (
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailTaken         = errors.New("email already taken")
	ErrInvalidRole        = errors.New("invalid role")
	ErrInvalidPassword    = errors.New("password must be at least 6 characters")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type Service struct {
	repo *Repo
}

func NewService(repo *Repo) *Service {
	return &Service{repo: repo}
}

func (s *Service) Register(req RegisterRequest) error {
	if len(req.Password) < 6 {
		return ErrInvalidPassword
	}

	accessLevel, ok := req.Role.AccessLevel()
	if !ok {
		return ErrInvalidRole
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	err = s.repo.CreateUser(req.FirstName, req.Surname, req.Email, string(hash), accessLevel, req.DeliveryAddress)
	if err != nil {
		if isDuplicateEmail(err) {
			return ErrEmailTaken
		}
		return err
	}
	return nil
}

func (s *Service) Login(req LoginRequest) (*User, error) {
	user, hash, err := s.repo.GetByEmail(req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}

func (s *Service) DeleteUser(userID int) error {
	return s.repo.DeleteUser(userID)
}

func (s *Service) UpdateDeliveryAddress(userID int, address string) error {
	return s.repo.UpdateDeliveryAddress(userID, address)
}

func isDuplicateEmail(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "Duplicate entry") || // MySQL
		strings.Contains(msg, "UNIQUE constraint failed") // SQLite
}
