## How to Run Locally
### Prerequisites
You must have the following installed on your machine:
* [Node.js](https://nodejs.org/)
* [Go](https://go.dev/)
* [PostgreSQL](https://www.postgresql.org/)
###  Database Setup
1. Open PostgreSQL (pgAdmin or psql terminal).
2. Create a new database named `ats_db`.

### Environment Variables
You will need two `.env` files.
**Backend `.env`** (Create inside the `/Backend` folder):
```env
MISTRAL_API_KEY=your_mistral_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
DATABASE_URL=postgres://postgres:your_password@localhost:5432/ats_db?sslmode=disable
```
**Frontend `.env`** (Create inside the `/frontend` folder):
```env
VITE_API_URL=http://localhost:8080
```
### Start Backend
Use commands(make sure u are in Backend directory):
1. go mod tidy
2. go run main.go

### Frontend
Use commands(make sure u are in frontend directory):
1. npm install
2. npm run dev
