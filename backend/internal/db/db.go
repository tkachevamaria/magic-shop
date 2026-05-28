package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

func InitDB(cfg Config) (*sql.DB, error) {
	// ✅ Вся строка DSN должна быть на одной линии или корректно собрана
	dsn := "file:" + cfg.DBPath + "?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=case_sensitive_like(0)"

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}

	if _, err := os.Stat(cfg.DBPath); os.IsNotExist(err) {
		log.Println("🪄 БД не найдена. Запускаем инициализацию...")
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
	searchPaths := []string{
		filename,
		"../" + filename,
		"backend/" + filename,
	}

	var data []byte
	var err error
	for _, p := range searchPaths {
		data, err = os.ReadFile(p)
		if err == nil {
			break
		}
	}
	if err != nil {
		return fmt.Errorf("файл %s не найден ни в одном из ожидаемых путей", filename)
	}

	_, err = db.Exec(string(data))
	return err
}