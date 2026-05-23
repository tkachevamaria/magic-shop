package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3" // SQLite-драйвер
)

// Открывает или создаёт БД, при первом запуске применяет схему и сиды
func InitDB(cfg Config) (*sql.DB, error) {
	// PRAGMA foreign_keys=1 включает проверки связей внутри БД между таблицами
	// journal_mode=WAL разрешает параллельное чтение/запись без блокировок
	dsn := "file:" + cfg.DBPath + "?_foreign_keys=1&journal_mode=WAL&busy_timeout=5000"
	
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, err
	}

	// Если файла нет -> создаём структуру и заполняем данными
	if _, err := os.Stat(cfg.DBPath); os.IsNotExist(err) {
		log.Println("? БД не найдена. Запускаем инициализацию...")
		if err := runSQL(db, "db/schema.sql"); err != nil {
			return nil, err
		}
		if err := runSQL(db, "db/seed.sql"); err != nil {
			return nil, err
		}
		log.Println("✅ БД создана и заполнена тестовыми данными!")
	}

	return db, db.Ping()
}

func runSQL(db *sql.DB, filename string) error {
	data, err := os.ReadFile(filename)
	if err != nil {
		return err
	}
	_, err = db.Exec(string(data))
	return err
}