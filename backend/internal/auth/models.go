package auth

type Role string

const (
	RoleStudent      Role = "student"      // AccessLevel 1
	RoleMage         Role = "mage"         // AccessLevel 2
	RoleProfessional Role = "professional" // AccessLevel 3
)

var roleToLevel = map[Role]int{
	RoleStudent:      1,
	RoleMage:         2,
	RoleProfessional: 3,
}

func (r Role) AccessLevel() (int, bool) {
	level, ok := roleToLevel[r]
	return level, ok
}

// перевод роли в число у нас на беке
type RegisterRequest struct {
	FirstName string `json:"first_name"`
	Surname   string `json:"surname"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Role      Role   `json:"role"` // "student" | "mage" | "professional"
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type User struct {
	UserID      int
	FirstName   string
	Surname     string
	Email       string
	AccessLevel int
	TotalSpent  float64
}
