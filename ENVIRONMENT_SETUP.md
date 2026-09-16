# Environment Setup Guide

This document explains all the environment variables needed to run the IIC NIT Durgapur application.

## Server Environment Variables (.env)

Create a `.env` file in the `/server` directory with the following variables:

### Required Variables

#### Database Configuration
```bash
MONGO_URI=mongodb://localhost:27017/iic-nitdgp
```
- **Local MongoDB**: Use `mongodb://localhost:27017/iic-nitdgp`
- **MongoDB Atlas**: Use `mongodb+srv://<username>:<password>@cluster.mongodb.net/iic-nitdgp`

#### JWT Configuration
```bash
JWT_ACCESS_SECRET=your-super-secret-access-token-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```
- **JWT_ACCESS_SECRET**: Secret key for access tokens (minimum 32 characters)
- **JWT_REFRESH_SECRET**: Secret key for refresh tokens (different from access secret)
- **JWT_ACCESS_EXPIRES_IN**: Access token expiration time (15 minutes recommended)
- **JWT_REFRESH_EXPIRES_IN**: Refresh token expiration time (7 days recommended)

#### Server Configuration
```bash
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```
- **PORT**: Server port (default: 8000)
- **NODE_ENV**: Environment mode (`development`, `production`, `test`)
- **FRONTEND_URL**: Frontend URL for CORS configuration

## Client Environment Variables (.env)

Create a `.env` file in the `/client` directory with the following variables:

### Required Variables

#### API Configuration
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```
- **VITE_API_BASE_URL**: Backend API base URL

#### Backend URL (used for file uploads)
```bash
VITE_BACKEND_URI=http://localhost:8000
```
- **VITE_BACKEND_URI**: Base URL of the backend server, used to build upload/API requests

### Optional Variables
```bash
VITE_APP_NAME=IIC NIT Durgapur
VITE_APP_VERSION=1.0.0
```

## File Uploads

File uploads (profile photos, CVs, event/gallery/carousel images) are handled entirely by
the backend and stored on the server's local disk under `server/public/uploads/<type>/`.
The server serves these files as static assets at `/uploads/<type>/<filename>`, and the
uploaded file's full URL is stored in MongoDB (same as any other field). No external
storage account or credentials are required.

## MongoDB Setup

### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/iic-nitdgp`

### MongoDB Atlas (Cloud)
1. Create account at mongodb.com
2. Create a new cluster
3. Create database user with read/write access
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string from "Connect" button
6. Replace `<username>` and `<password>` with your credentials

## Security Notes

- **Never commit .env files to version control**
- **Use strong, random secrets for JWT keys**
- **Change default secrets in production**
- **Use environment-specific configurations**
- **Regularly rotate API keys and secrets**

## Development Setup

1. **Server**:
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your values
   npm start
   ```

2. **Client**:
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env with your values
   npm run dev
   ```

## Production Deployment

For production deployment, ensure:
- Set `NODE_ENV=production`
- Use production database URLs
- Use strong JWT secrets
- Configure proper CORS settings
- Set up proper logging
- Use HTTPS for all endpoints
- Ensure `server/public/uploads` is persisted (e.g. mounted volume) across deploys

## Troubleshooting

### Common Issues:
1. **MongoDB Connection Failed**: Check connection string and network access
2. **JWT Token Invalid**: Verify JWT secrets are correctly set
3. **File Upload Failed**: Ensure the server can write to `server/public/uploads` and that `VITE_BACKEND_URI` points to the running backend
4. **CORS Errors**: Verify FRONTEND_URL matches your client URL
5. **Port Already in Use**: Change PORT in server .env file
