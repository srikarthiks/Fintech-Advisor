# Finance Manager Backend

This is the backend API server for the Finance Manager application.

## Features

- **Authentication**: JWT-based user authentication
- **Target Management**: Create, read, update, delete financial targets
- **Action Step Tracking**: Track individual action steps with amounts
- **Progress Tracking**: Update and monitor target progress
- **Transaction Management**: Handle income and expense transactions
- **Budget Management**: Manage monthly budgets
- **Financial Analysis**: Generate financial insights

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Targets
- `GET /api/targets` - Get all user targets
- `POST /api/targets` - Create new target
- `PUT /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target
- `PUT /api/targets/:id/progress` - Update target progress

### Action Steps
- `PUT /api/targets/:targetId/steps/:stepId` - Update action step (completion/amount)

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction

### Categories
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category

### Budgets
- `GET /api/budgets` - Get user budgets
- `POST /api/budgets` - Create/update budget

### Analysis
- `POST /api/analyze` - Generate financial analysis

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Start Production Server**:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3010`

## Database

The application uses SQLite database (`finance_manager.db`) which will be created automatically on first run.

### Tables Created:
- `users` - User accounts
- `categories` - Transaction categories
- `transactions` - Financial transactions
- `budgets` - Budget data
- `targets` - Financial targets
- `action_steps` - Target action steps

## Environment Variables

For production, set these environment variables:
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3010)

## API Usage Examples

### Create Target
```javascript
POST /api/targets
{
  "name": "Emergency Fund",
  "targetAmount": 100000,
  "currentAmount": 0,
  "targetDate": "2024-12-31",
  "planDetails": {
    "missionBrief": "Build emergency fund",
    "investmentArenas": [...],
    "roadmap": [...]
  }
}
```

### Update Action Step
```javascript
PUT /api/targets/1/steps/step-1
{
  "completed": true,
  "amount": 5000
}
```

### Update Target Progress
```javascript
PUT /api/targets/1/progress
{
  "currentAmount": 15000
}
```

## Security Notes

- Change the JWT_SECRET in production
- All endpoints require authentication except login/register
- User data is isolated by user_id
- SQL injection protection through parameterized queries
