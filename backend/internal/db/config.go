package db

// Параметры подключения к БД
type Config struct {
	DBPath string
}

func DefaultConfig() Config {
	return Config{
		DBPath: "./hp_market.db",
	}
}