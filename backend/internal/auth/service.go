package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo *Repo
}

func NewService(repo *Repo) *Service {
	return &Service{repo: repo}
}

func (s *Service) Register(req RegisterRequest) error {
	accessLevel, ok := req.Role.AccessLevel()
	if !ok {
		return errors.New("invalid role")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.repo.CreateUser(req.FirstName, req.Surname, req.Email, string(hash), accessLevel, req.DeliveryAddress)
}

func (s *Service) Login(req LoginRequest) (*User, error) {
	user, hash, err := s.repo.GetByEmail(req.Email)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid password")
	}

	return user, nil
}

func (s *Service) DeleteUser(userID int) error {
	return s.repo.DeleteUser(userID)
}

func (s *Service) UpdateDeliveryAddress(userID int, address string) error {
	return s.repo.UpdateDeliveryAddress(userID, address)
}
