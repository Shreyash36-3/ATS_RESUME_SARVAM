package config

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func ConnectDB() {
	// Defaults to localhost if DATABASE_URL is not set
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		// UPDATE THIS LINE with your local postgres username and password
		dsn = "postgres://postgres:5630@localhost:5432/ats_db?sslmode=disable"
	}

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}

	DB = pool
	fmt.Println("Connected to PostgreSQL database!")
}
