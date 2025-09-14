# 💰 Fintech-Advisor: AI-Powered Personal Finance Manager

A comprehensive full-stack financial management application that combines React frontend with Node.js backend, featuring AI-powered financial advice, goal setting, and investment tracking.

![Finance Manager](https://img.shields.io/badge/Finance-Manager-blue) ![React](https://img.shields.io/badge/React-18.x-61dafb) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![AI-Powered](https://img.shields.io/badge/AI-Gemini-orange)

## 🌟 Features

### 🤖 AI-Powered Financial Advice
- **Personalized Recommendations**: Get tailored financial advice based on your income, expenses, and financial goals
- **Conversational Interface**: Chat with AI advisor to clarify doubts and get detailed explanations
- **Smart Analysis**: AI analyzes your financial patterns and suggests optimal strategies

### 🎯 Target Setting & Action Planning
- **Goal Definition**: Set financial targets with specific amounts and timelines
- **AI Strategy Generation**: Receive multiple saving strategies (FD, SIP, etc.) tailored to your goals
- **Excel-like Action Plans**: Visualize your progress with detailed month-by-month breakdowns
- **Progress Tracking**: Monitor your achievements with real-time progress updates

### 💼 Investment Tracking
- **Investment Management**: Track investments linked to specific targets and action steps
- **Progress Integration**: Investment amounts automatically update target progress
- **Editable Interface**: Update investment amounts directly in the action plan table

### 📊 Financial Dashboard
- **Transaction Management**: Add, edit, and categorize income, expenses, and investments
- **Budget Tracking**: Set and monitor budgets for different categories
- **Financial Analysis**: View spending patterns and financial health metrics
- **Data Visualization**: Charts and graphs for better financial insights

### 🔐 User Authentication
- **Secure Login/Register**: JWT-based authentication system
- **User Data Protection**: Personal financial data secured with proper authentication
- **Session Management**: Persistent login sessions with automatic token refresh

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/srikarthiks/Fintech-Advisor.git
   cd Fintech-Advisor
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

### 🏃‍♂️ Running the Application

#### Option 1: Using Startup Scripts (Recommended)

**Windows:**
```bash
# Start backend server
start-backend.bat

# In a new terminal, start frontend
npm run dev
```

**Linux/Mac:**
```bash
# Start backend server
chmod +x start-backend.sh
./start-backend.sh

# In a new terminal, start frontend
npm run dev
```

#### Option 2: Manual Start

1. **Start Backend Server**
   ```bash
   cd backend
   node server.js
   ```
   Backend will run on `http://localhost:3010`

2. **Start Frontend (in new terminal)**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### 🌐 Access the Application
Open your browser and navigate to `http://localhost:5173`

## 📖 Usage Guide

### 1. Getting Started
1. **Register/Login**: Create an account or login with existing credentials
2. **Dashboard Overview**: View your financial summary and key metrics
3. **Add Transactions**: Start by adding your income and expense transactions

### 2. Setting Financial Targets
1. **Navigate to Targets**: Click on "Targets" in the sidebar
2. **Create New Target**: 
   - Click "Set New Target"
   - Enter target amount and timeline
   - Click "Get AI Advice"
3. **AI Consultation**: 
   - Chat with AI advisor for personalized strategies
   - Ask questions about investment options
   - Get clarification on saving methods
4. **Save Target**: Once satisfied, save your target with action plan

### 3. Managing Action Plans
1. **View Action Plan**: Click "SHOW ACTION PLAN" on any target
2. **Track Progress**: 
   - Mark action steps as completed
   - Enter amounts saved for each step
   - Update investment amounts in the Excel-like table
3. **Monitor Progress**: Watch real-time progress updates and percentage completion

### 4. Investment Tracking
1. **Add Investments**: Use the investment column in action plans
2. **Link to Targets**: Investments automatically link to specific targets
3. **Progress Updates**: Investment amounts update overall target progress
4. **Transaction History**: View all investment transactions in the transactions page

### 5. Transaction Management
1. **Add Transactions**: 
   - Income: Salary, bonuses, etc.
   - Expenses: Bills, groceries, entertainment
   - Investments: SIP, FD, mutual funds
2. **Categorize**: Organize transactions by categories
3. **Link to Targets**: Connect investment transactions to specific targets

### 6. Budget Management
1. **Set Budgets**: Define monthly budgets for different categories
2. **Monitor Spending**: Track actual vs. budgeted amounts
3. **Get Alerts**: Receive notifications when approaching budget limits

### 7. AI Financial Advisor
1. **Access Advisor**: Click on "AI Advisor" in the sidebar
2. **Get Analysis**: Receive comprehensive financial health analysis
3. **Ask Questions**: Use the chat interface for personalized advice
4. **Strategy Recommendations**: Get investment and saving strategy suggestions

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/          # React components
│   ├── TargetPage.tsx   # Target setting and action plans
│   ├── AdvisorPage.tsx  # AI financial advisor
│   ├── TransactionsPage.tsx # Transaction management
│   ├── Dashboard.tsx    # Main dashboard
│   └── ...
├── services/            # API services
│   ├── apiService.ts    # Backend API calls
│   └── geminiService.ts # AI service integration
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main application component
```

### Backend (Node.js + Express)
```
backend/
├── server.js           # Main server file
├── package.json        # Backend dependencies
├── README.md          # Backend setup guide
└── finance_manager.db # SQLite database
```

### Database Schema
- **users**: User authentication and profile data
- **targets**: Financial goals and targets
- **action_steps**: Detailed action plans for targets
- **transactions**: Income, expense, and investment records
- **categories**: Transaction categorization
- **budgets**: Budget tracking data

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
# AI Service Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_URL=./backend/finance_manager.db

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
```

### Backend Configuration
The backend server runs on port 3010 by default. To change this, modify the `PORT` variable in `backend/server.js`.

## 🛠️ Development

### Adding New Features
1. **Frontend**: Add components in `src/components/`
2. **Backend**: Add routes in `backend/server.js`
3. **Database**: Update schema in server initialization
4. **Types**: Update TypeScript interfaces in `src/types.ts`

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### Targets
- `GET /api/targets` - Get all targets
- `POST /api/targets` - Create new target
- `PUT /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target
- `PUT /api/targets/:id/progress` - Update target progress
- `GET /api/targets/:id/investments` - Get target investments

#### Action Steps
- `PUT /api/targets/:id/steps/:stepId` - Update action step

#### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

#### Analysis
- `POST /api/analyze` - Get AI financial analysis

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting**
   ```bash
   # Check if port 3010 is available
   netstat -an | findstr :3010
   
   # Kill existing Node processes
   taskkill /f /im node.exe
   ```

2. **Database connection issues**
   - Ensure SQLite database file exists in `backend/` directory
   - Check file permissions for database access

3. **Frontend build errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **API connection errors**
   - Verify backend server is running on port 3010
   - Check CORS settings in backend configuration
   - Ensure authentication tokens are valid

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React** - Frontend framework
- **Node.js & Express** - Backend server
- **SQLite** - Database
- **Tailwind CSS** - Styling
- **Gemini AI** - AI-powered financial advice

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

---

**Made with ❤️ for better financial management**