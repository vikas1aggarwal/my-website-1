# 🚀 Real Estate ERP - Automated Deployment Package

This package provides automated scripts and tools to deploy the Real Estate ERP system in any environment with minimal manual intervention.

## 📋 Prerequisites

### System Requirements:
- **Python 3.8+**
- **Node.js 16+**
- **npm 8+**
- **Git**

### Operating Systems:
- ✅ **Linux/macOS**: Use `install.sh`
- ✅ **Windows**: Use `install.bat`
- ✅ **Docker**: Use `docker-compose.prod.yml`

## 🎯 Quick Start

### Option 1: One-Command Installation (Recommended)

#### Linux/macOS:
```bash
# Make script executable and run
chmod +x deploy/install.sh
./deploy/install.sh
```

#### Windows:
```cmd
# Run the batch file
deploy\install.bat
```

### Option 2: Using npm Scripts

```bash
# Install deployment package
cd deploy
npm install

# Run automated installation
npm run install:all

# Start the application
npm run start:prod
```

## 📦 What Gets Installed

### Backend (FastAPI):
- ✅ Python virtual environment
- ✅ All Python dependencies
- ✅ Database initialization
- ✅ Environment configuration
- ✅ Startup scripts

### Frontend (React):
- ✅ Node.js dependencies
- ✅ Production build
- ✅ Startup scripts

### System Services:
- ✅ Systemd service files (Linux)
- ✅ Docker deployment files
- ✅ Environment configuration

## 🚀 Available Commands

### Installation Commands:
```bash
npm run install:all          # Install backend + frontend
npm run install:backend      # Install backend only
npm run install:frontend     # Install frontend only
npm run install:windows      # Windows installation
```

### Startup Commands:
```bash
npm run start:dev            # Start in development mode
npm run start:prod           # Start in production mode
npm run start:backend:dev    # Start backend in dev mode
npm run start:frontend:dev   # Start frontend in dev mode
npm run start:backend:prod   # Start backend in production
npm run start:frontend:prod  # Start frontend in production
```

### Build Commands:
```bash
npm run build:all            # Build backend + frontend
npm run build:backend        # Build backend only
npm run build:frontend       # Build frontend only
```

### Testing Commands:
```bash
npm run test:all             # Test backend + frontend
npm run test:backend         # Test backend only
npm run test:frontend        # Test frontend only
```

### Deployment Commands:
```bash
npm run deploy:docker        # Deploy with Docker
npm run deploy:docker:stop   # Stop Docker deployment
npm run deploy:docker:logs   # View Docker logs
npm run deploy:systemd       # Deploy with systemd
npm run deploy:systemd:stop  # Stop systemd services
npm run deploy:systemd:status # Check systemd status
```

### Maintenance Commands:
```bash
npm run clean                # Clean all installations
npm run clean:docker         # Clean Docker resources
npm run setup:env            # Setup environment file
npm run health:check         # Check application health
npm run logs:backend         # View backend logs
npm run logs:frontend        # View frontend logs
npm run backup:db            # Backup database
npm run restore:db           # Restore database
npm run update:all           # Update all dependencies
npm run monitor:resources    # Monitor system resources
npm run security:check       # Security audit
```

## 🌐 Access URLs

After successful installation:

- **Backend API**: http://localhost:8000
- **Frontend App**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📁 Generated Files

### Startup Scripts:
- `start_app.sh` / `start_app.bat` - Start both services
- `start_backend.sh` / `start_backend.bat` - Start backend only
- `start_frontend.sh` / `start_frontend.bat` - Start frontend only

### Configuration Files:
- `.env` - Environment configuration
- `docker-compose.prod.yml` - Docker deployment
- Systemd service files (Linux)

## 🐳 Docker Deployment

### Quick Docker Setup:
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Docker Commands:
```bash
npm run deploy:docker        # Deploy with Docker
npm run deploy:docker:stop   # Stop Docker services
npm run deploy:docker:logs   # View Docker logs
```

## 🔧 Systemd Services (Linux)

### Enable Services:
```bash
# Enable and start services
npm run deploy:systemd

# Check status
npm run deploy:systemd:status

# Stop services
npm run deploy:systemd:stop
```

### Manual Control:
```bash
sudo systemctl enable realestate-backend
sudo systemctl enable realestate-frontend
sudo systemctl start realestate-backend
sudo systemctl start realestate-frontend
```

## 📊 Monitoring & Maintenance

### Health Checks:
```bash
# Check application health
npm run health:check

# Monitor system resources
npm run monitor:resources

# View logs
npm run logs:backend
npm run logs:frontend
```

### Database Management:
```bash
# Backup database
npm run backup:db

# Restore database
npm run restore:db
```

### Updates:
```bash
# Update all dependencies
npm run update:all

# Update backend only
npm run update:backend

# Update frontend only
npm run update:frontend
```

## 🔒 Security Features

### Security Audit:
```bash
# Check for security issues
npm run security:check
```

### Environment Security:
- ✅ Automatic secret key generation
- ✅ Environment variable isolation
- ✅ No hardcoded credentials

## 🚨 Troubleshooting

### Common Issues:

#### 1. Port Already in Use:
```bash
# Check what's using the port
lsof -i :8000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### 2. Permission Issues:
```bash
# Fix permissions
chmod +x deploy/install.sh
chmod +x start_*.sh
```

#### 3. Virtual Environment Issues:
```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements_simple.txt
```

#### 4. Node.js Issues:
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Logs and Debugging:
```bash
# View backend logs
npm run logs:backend

# View frontend logs
npm run logs:frontend

# Check application health
npm run health:check
```

## 📚 Advanced Configuration

### Custom Environment Variables:
Edit the `.env` file after installation:
```bash
# Production settings
ENVIRONMENT=production
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Database settings
DATABASE_URL=postgresql://user:password@localhost/realestate

# Security settings
SECRET_KEY=your-custom-secret-key
```

### Custom Ports:
Modify the startup scripts to use different ports:
```bash
# Backend on port 9000
uvicorn simple_app:app --host 0.0.0.0 --port 9000 --workers 4

# Frontend on port 4000
npx serve -s build -l 4000
```

## 🎯 Production Deployment

### 1. Server Setup:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-venv nodejs npm nginx

# Clone repository
git clone <your-repo-url>
cd my-website-1
```

### 2. Automated Installation:
```bash
# Run installation script
chmod +x deploy/install.sh
./deploy/install.sh
```

### 3. Configure Nginx (Optional):
```bash
# Copy nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 4. SSL Setup (Recommended):
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📞 Support

### Getting Help:
1. **Check logs**: `npm run logs:backend` or `npm run logs:frontend`
2. **Health check**: `npm run health:check`
3. **Review installation**: Check generated files and scripts
4. **Common issues**: See troubleshooting section above

### File Locations:
- **Backend logs**: `/var/log/realestate-backend.log`
- **Frontend logs**: `/var/log/nginx/access.log`
- **Application**: Current directory
- **Database**: `realestate.db` (SQLite)

---

## 🎉 Success!

After running the installation script, you should see:
- ✅ All dependencies installed
- ✅ Database initialized
- ✅ Frontend built
- ✅ Startup scripts created
- ✅ Services configured

Your Real Estate ERP application is now ready to use! 🚀

---

*For more information, check the main project README.md file.*
