# SQL Query Server API

A TypeScript Express server with TypeORM and SQLite that provides a REST API for executing SQL queries.

## Features

- **Full SQL Support**: Execute any SQL query (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER)
- **Transaction Support**: Execute multiple queries in a single transaction
- **Security**: Rate limiting, input validation, and SQL injection protection
- **Schema Inspection**: Get database table information
- **TypeORM Integration**: Uses TypeORM with SQLite database
- **TypeScript**: Fully typed with comprehensive error handling

## API Endpoints

### Health Check
```
GET /api/health
```

### Get Database Schema
```
GET /api/schema
GET /api/schema?table=tablename
```

### Execute Safe Query (SELECT only)
```
POST /api/query/safe
Content-Type: application/json

{
  "query": "SELECT * FROM users WHERE age > ?",
  "params": [18]
}
```

### Execute Any Query
```
POST /api/query/execute
Content-Type: application/json

{
  "query": "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
  "params": ["John Doe", "john@example.com", 25]
}
```

### Execute Transaction
```
POST /api/query/transaction
Content-Type: application/json

{
  "queries": [
    {
      "query": "INSERT INTO users (name, email) VALUES (?, ?)",
      "params": ["Alice", "alice@example.com"]
    },
    {
      "query": "INSERT INTO posts (title, content, userId) VALUES (?, ?, ?)",
      "params": ["My Post", "Post content", 1]
    }
  ]
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": [...],
  "affectedRows": 1,
  "insertId": 123,
  "executionTime": 45
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "executionTime": 12
}
```

## Installation & Usage

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
npm start
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes for queries, 50 for executions
- **Input Validation**: Query validation using Joi
- **SQL Injection Protection**: Basic keyword filtering for safe endpoints
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers

## Database

The server uses SQLite with TypeORM. Sample entities (User and Post) are included for demonstration.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## Example Usage

```javascript
// Execute a SELECT query
const response = await fetch('http://localhost:3000/api/query/safe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'SELECT * FROM users WHERE age > ?',
    params: [18]
  })
});

const result = await response.json();
console.log(result.data);
```