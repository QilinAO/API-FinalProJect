# 🐟 Betta Fish Project - Backend API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation
```bash
npm install
```

### Environment Setup
Copy `.env.example` to `.env` and configure:
```env
# Node Environment
NODE_ENV=development

# Server Configuration
PORT=5000

# Frontend URLs
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Database Configuration (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# HuggingFace Model API
HUGGINGFACE_API_TOKEN=your_token_here
HUGGINGFACE_SPACE_ID=QilinAO/betta-ts-space
HUGGINGFACE_SPACE_URL=https://qilinao-betta-ts-space.hf.space
USE_GRADIO_API=true
```

### Development
```bash
npm run dev
```

API will run at: http://localhost:5000

### Production
```bash
npm start
```

## 🔧 Configuration

### CORS
- Configured for localhost:5173, 5174, 5175
- Supports multiple frontend origins
- Credentials enabled

### Rate Limiting
- 500 requests per 15 minutes per IP
- Configurable via environment variables

### Database
- Supabase PostgreSQL
- Row Level Security (RLS) enabled
- Service role for admin operations

## 📁 Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
└── utils/           # Utility functions
```

## 🔗 API Endpoints

### Public Routes
- `GET /api/health` - Health check
- `GET /api/public/contests` - Get active contests
- `GET /api/public/content/*` - Public content

### Authentication Required
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/users/*` - User operations

### Model API
- `GET /api/model/health` - Model status
- `POST /api/model/predict` - AI prediction

## 🤖 AI Model Integration

### HuggingFace Space
- **Space ID**: QilinAO/betta-ts-space
- **API Type**: Gradio Space API
- **Features**: Betta fish classification

### Configuration
```env
USE_GRADIO_API=true
HUGGINGFACE_SPACE_ID=QilinAO/betta-ts-space
HUGGINGFACE_API_TOKEN=your_token_here
```

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - DDoS protection
- **CORS** - Cross-origin protection
- **JWT Authentication** - Secure tokens
- **Input Validation** - Request sanitization

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles
- `contests` - Betta contests
- `submissions` - Contest submissions
- `evaluations` - Expert evaluations

## 🚨 Error Handling

- **Global Error Handler** - Centralized error management
- **Database Error Handler** - Supabase error translation
- **Validation Middleware** - Request validation
- **Error Reporting** - Telegram notifications (optional)

## 📝 Scripts

- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run cron:assignments` - Run assignment cron job

## 🔍 Monitoring

- **Health Checks** - `/api/health` endpoint
- **Request Logging** - Morgan middleware
- **Error Reporting** - Telegram bot integration
- **Database Monitoring** - Connection status

## 🚀 Deployment

### Railway
```bash
railway up
```

### Render
```bash
render deploy
```

### Environment Variables
Set all required environment variables in your deployment platform.

## 📚 Documentation

- [API Documentation](./API_DOCS.md)
- [Deployment Guide](./DEPLOYMENT_BACKEND.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Security Guide](./SECURITY.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

Private Project - All Rights Reserved

---

Made with ❤️ for BettaFish Community
