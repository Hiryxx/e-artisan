# E-Artisan

## Starting the project
### 1. Move to the backend directory and install dependencies
```bash
cd backend
npm install
```

### 2. Set up the environment variables
```bash
cp .env.example .env
```

### 3. Start the docker containers
```bash
docker-compose up -d
```

### You can now access the backend at http://localhost:3000/index.html
---

# E-Artisan API Testing

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create test database:
   ```bash
   npm run test:setup
   ```

3. Configure `.env.test` with your database credentials

## Running Tests

- Run all tests: `npm test`
- Run with coverage: `npm run test:coverage`
- Run in watch mode: `npm run test:watch`
- Run only unit tests: `npm run test:unit`
- Run only integration tests: `npm run test:integration`

## Cleanup

To remove test database:
```bash
npm run test:cleanup
```

## Test Structure

- `test/api.test.js` - Complete API endpoint tests
- `test/integration.test.js` - Integration flow tests
- `test/helpers.js` - Utility functions
- `test/setup.js` - Database configuration




