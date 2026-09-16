# 🚀 IIC NIT Durgapur - Innovation and Incubation Cell

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive web application for the Innovation and Incubation Cell of National Institute of Technology, Durgapur. This platform serves as the central hub for innovation activities, events, team management, and student engagement within the institution.

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [📁 Project Structure](#-project-structure)
- [⚡ Quick Start](#-quick-start)
- [🔧 Installation](#-installation)
- [📧 Environment Configuration](#-environment-configuration)
- [🔐 Authentication System](#-authentication-system)
- [👥 User Management](#-user-management)
- [🎨 Features Overview](#-features-overview)
- [📱 API Documentation](#-api-documentation)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🌟 Features

### 🎯 Core Features
- **Modern User Interface** - React 19 with responsive design
- **Authentication System** - JWT-based secure authentication
- **Role-Based Access Control** - Admin, User, and Guest roles
- **Event Management** - Create, manage, and showcase events
- **Team Management** - Display team members with dynamic data
- **Innovation Hub** - Submit and manage innovation ideas
- **Image Gallery** - Local server-side file storage
- **Newsletter System** - Email subscription and management
- **Search Functionality** - Global search across all content
- **Mobile Responsive** - Optimized for all device sizes

### 🔒 Security Features
- JWT Token Authentication
- Password Hashing (bcrypt)
- Protected Routes
- CORS Configuration
- Environment Variable Security
- Input Validation

### 🎨 UI/UX Features
- Modern Glass-morphism Design
- Smooth Animations (Framer Motion)
- Loading Skeletons
- Toast Notifications
- Modal System
- Responsive Grid Layouts
- Dark/Light Theme Support

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.0.0 | Core Framework |
| **Vite** | 6.2.0 | Build Tool |
| **React Router** | 7.3.0 | Navigation |
| **Redux Toolkit** | 2.8.2 | State Management |
| **SCSS** | Latest | Styling |
| **Framer Motion** | 12.5.0 | Animations |
| **Material-UI** | 6.4.7 | Component Library |
| **React Hook Form** | 7.56.3 | Form Management |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest | Runtime Environment |
| **Express.js** | 5.1.0 | Web Framework |
| **MongoDB** | 8.14.2 | Database |
| **Mongoose** | 8.14.2 | ODM |
| **JWT** | 9.0.2 | Authentication |
| **bcryptjs** | 3.0.2 | Password Hashing |

### Cloud Services
- **Local Disk Storage** - Image/File Storage (server/public/uploads)
- **MongoDB Atlas** - Database Hosting (Optional)
- **Vercel** - Frontend Deployment
- **Render/Railway** - Backend Deployment

## 📁 Project Structure

```
IICNITDGP/
├── 📁 client/                    # Frontend React Application
│   ├── 📁 public/               # Static Assets
│   │   ├── 📁 assets/           # Images, Icons
│   │   └── 📁 data/             # JSON Data Files
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable Components
│   │   ├── 📁 pages/           # Page Components
│   │   ├── 📁 layouts/         # Layout Components
│   │   ├── 📁 services/        # API Services
│   │   ├── 📁 store/           # Redux Store
│   │   ├── 📁 routes/          # Route Configuration
│   │   └── 📁 config/          # Configuration Files
│   ├── package.json
│   └── vite.config.js
├── 📁 server/                   # Backend Node.js Application
│   ├── 📁 Controller/          # Route Controllers
│   ├── 📁 model/               # MongoDB Models
│   ├── 📁 Routes/              # API Routes
│   ├── 📁 middleware/          # Custom Middleware
│   ├── 📁 config/              # Database Configuration
│   ├── 📁 utils/               # Utility Functions
│   ├── package.json
│   └── index.js                # Server Entry Point
├── 📄 README.md
├── 📄 ENVIRONMENT_SETUP.md      # Environment Configuration
└── 📄 AUTH_README.md            # Authentication Guide
```

## ⚡ Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (Local or Atlas)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/sandipto729/IICNITDGP.git
cd IICNITDGP
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Setup
```bash
# Server environment
cd server
cp .env.example .env
# Edit .env with your configuration

# Client environment
cd ../client
cp .env.example .env
# Edit .env with your configuration
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend Server
cd server
npm run dev

# Terminal 2 - Frontend Development Server
cd client
npm run dev
```

### 5. Access Application
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/api

## 🔧 Installation

### Detailed Installation Steps

#### 1. System Requirements
```bash
# Check Node.js version
node --version  # Should be v18+

# Check npm version
npm --version   # Should be v8+

# Check Git
git --version
```

#### 2. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod --dbpath /path/to/your/data
```

**Option B: MongoDB Atlas**
```bash
# Create account at https://cloud.mongodb.com
# Create cluster and get connection string
# Update MONGO_URI in .env file
```

## 📧 Environment Configuration

### Server Environment Variables (.env)
```bash
# Database
MONGO_URI=mongodb://localhost:27017/iic-nitdgp

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-token-key
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Client Environment Variables (.env)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_BACKEND_URI=http://localhost:8000
```

## 🔐 Authentication System

### User Roles
- **Admin**: Full system access, user management, content management
- **User**: Profile management, event participation, innovation submissions
- **Guest**: Public content viewing

### Authentication Flow
1. **Registration**: Email verification and profile creation
2. **Login**: JWT token generation
3. **Protected Routes**: Token validation middleware
4. **Refresh Tokens**: Automatic token renewal
5. **Logout**: Token invalidation

### API Endpoints
```bash
POST /api/auth/register     # User Registration
POST /api/auth/login        # User Login
POST /api/auth/refresh      # Token Refresh
POST /api/auth/logout       # User Logout
GET  /api/auth/profile      # Get User Profile
PUT  /api/auth/profile      # Update Profile
```

## 👥 User Management

### User Model Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['admin', 'user'],
  designation: String,
  type: String,
  extra: {
    linkedin: String,
    github: String
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Admin Features
- **User Management**: View, edit, activate/deactivate users
- **Content Management**: Manage events, innovations, gallery
- **Analytics**: User statistics and engagement metrics
- **System Settings**: Configuration and maintenance

## 🎨 Features Overview

### 🎭 Event Management
- **Event Creation**: Rich text editor, image upload, scheduling
- **Event Categories**: Workshops, seminars, competitions
- **Registration System**: User registration with form validation
- **Event Display**: Upcoming and past events with filtering
- **Modal System**: Detailed event view with responsive design

### 💡 Innovation Hub
- **Idea Submission**: Submit innovative project ideas
- **Admin Review**: Admin panel for reviewing submissions
- **Status Tracking**: Track submission status and feedback
- **Gallery Integration**: Showcase successful innovations

### 🖼️ Gallery System
- **Local Storage**: Server-side disk-based image storage
- **Upload Management**: Admin-controlled image uploads
- **Responsive Grid**: Masonry layout with lightbox viewing
- **Image Optimization**: Automatic compression and resizing

### 📧 Newsletter System
- **Subscription Management**: Email collection and validation
- **Admin Dashboard**: Subscriber management
- **Email Templates**: Customizable newsletter templates

### 🔍 Search Functionality
- **Global Search**: Search across events, innovations, team members
- **Filter Options**: Date, category, status filtering
- **Real-time Results**: Instant search with debouncing

## 📱 API Documentation

### Authentication Endpoints
```bash
# Register new user
POST /api/auth/register
Content-Type: application/json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}

# Login user
POST /api/auth/login
Content-Type: application/json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Event Endpoints
```bash
# Get all events
GET /api/events

# Get single event
GET /api/events/:id

# Create event (Admin only)
POST /api/events
Authorization: Bearer <token>

# Update event (Admin only)
PUT /api/events/:id
Authorization: Bearer <token>

# Delete event (Admin only)
DELETE /api/events/:id
Authorization: Bearer <token>
```

### User Management Endpoints
```bash
# Get all users (Admin only)
GET /api/users
Authorization: Bearer <admin-token>

# Update user role (Admin only)
PUT /api/users/:id/role
Authorization: Bearer <admin-token>

# Activate/Deactivate user (Admin only)
PUT /api/users/:id/status
Authorization: Bearer <admin-token>
```

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod

# Environment Variables in Vercel
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### Backend Deployment (Railway/Render)
```bash
# Deployment Configuration
PORT=8000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
FRONTEND_URL=https://your-frontend-domain.com

# Build Script
npm start
```

### Database Deployment
```bash
# MongoDB Atlas Setup
1. Create cluster
2. Configure network access
3. Create database user
4. Update connection string
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Coding Standards
- **ESLint** configuration for code quality
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Component-based** architecture
- **SCSS Modules** for styling

### Testing
```bash
# Run frontend tests
cd client
npm run test

# Run backend tests
cd server
npm run test

# Run E2E tests
npm run test:e2e
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NIT Durgapur** - For providing the platform and support
- **Innovation and Incubation Cell** - For the vision and requirements
- **Open Source Community** - For the amazing tools and libraries
- **Contributors** - For their valuable contributions

## 📞 Support

For support and queries:
- **Email**: iic@nitdgp.ac.in
- **GitHub Issues**: [Create an Issue](https://github.com/sandipto729/IICNITDGP/issues)
- **Documentation**: Check the `/docs` folder for detailed guides

---

<p align="center">
  Made with ❤️ by the IIC NIT Durgapur Team
</p>

<p align="center">
  <a href="https://nitdgp.ac.in">NIT Durgapur</a> •
  <a href="https://github.com/sandipto729/IICNITDGP">GitHub Repository</a> •
  <a href="https://www.iicnitdgp.in">Live Demo</a>
</p>
