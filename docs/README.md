# Real Estate Project Management System

A comprehensive, AI-powered project management system designed specifically for builders and architects. This system transforms from a simple project tracker into a full-featured ERP solution.

## 🚀 Features

### Current Features (MVP)
- ✅ Project creation and management
- ✅ Task management with dependencies
- ✅ Critical Path Method (CPM) scheduling
- ✅ Cost tracking and analysis
- ✅ Progress alerts and notifications
- ✅ Project deletion with cleanup

### Planned Features (Full ERP)
- 🔄 **Material Intelligence**: AI-powered material recommendations
- 🔄 **Progress Tracking**: Photo-based updates with approval workflow
- 🔄 **Team Management**: Role-based access control and collaboration
- 🔄 **Cost Estimation**: ML-based cost predictions from historical data
- 🔄 **Mobile App**: Progressive Web App for field workers
- 🔄 **Advanced Reporting**: Comprehensive analytics and insights

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React.js 18 + TypeScript + Material-UI
- **Backend**: FastAPI (Python) + SQLAlchemy
- **Database**: PostgreSQL
- **Authentication**: JWT + OAuth2
- **File Storage**: MinIO (S3-compatible)
- **Real-time**: WebSocket
- **Deployment**: Docker + Docker Compose

### System Components
- **Material Intelligence Engine**: AI-powered recommendations
- **Progress Tracking System**: Photo updates with approval workflow
- **Cost Estimation Engine**: ML-based cost predictions
- **Team Management**: Role-based access control
- **Real-time Collaboration**: Live updates and notifications

## 📚 Documentation

- **[Architecture Blueprint](ARCHITECTURE.md)**: Detailed system design and data model
- **[Development Plan](DEVELOPMENT_PLAN.md)**: Implementation roadmap and workflow
- **[API Documentation](API.md)**: Backend API specifications
- **[User Guide](USER_GUIDE.md)**: End-user documentation

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vikas1aggarwal/my-website-1.git
   cd my-website-1
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure database**
   ```bash
   # Set environment variables
   export DATABASE_URL="postgresql://user:password@localhost/realestate_db"
   
   # Initialize database
   python -m app.db
   ```

5. **Run the application**
   ```bash
   streamlit run app/main.py
   ```

6. **Open your browser**
   Navigate to `http://localhost:8501`

## 🔧 Development

### Project Structure
```
my-website-1/
├── app/                    # Backend application
│   ├── main.py            # Main Streamlit application
│   ├── models.py          # Database models
│   ├── db.py              # Database configuration
│   └── services/          # Business logic services
├── docs/                   # Documentation
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

### Development Workflow
1. **Feature Development**: Create feature branches from `main`
2. **Code Review**: Submit pull requests for review
3. **Testing**: Ensure all tests pass
4. **Deployment**: Merge to `main` and deploy

### Code Quality
- **Linting**: ESLint for frontend, Flake8 for backend
- **Testing**: Unit tests with pytest
- **Type Checking**: TypeScript for frontend, mypy for backend
- **Security**: Regular security audits

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📊 Roadmap

### Phase 1: Foundation (2-3 weeks)
- [x] Basic project management
- [x] Task management
- [ ] User authentication
- [ ] Database schema
- [ ] Docker setup

### Phase 2: Material Intelligence (2-3 weeks)
- [ ] Material database
- [ ] AI recommendations
- [ ] Cost estimation
- [ ] Material comparisons

### Phase 3: Progress Tracking (2-3 weeks)
- [ ] Photo uploads
- [ ] Approval workflow
- [ ] Team management
- [ ] Real-time updates

### Phase 4: ERP Features (3-4 weeks)
- [ ] Advanced reporting
- [ ] Mobile optimization
- [ ] Integration features
- [ ] Performance optimization

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/vikas1aggarwal/my-website-1/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/vikas1aggarwal/my-website-1/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/vikas1aggarwal/my-website-1/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Streamlit** for the initial MVP framework
- **FastAPI** for the modern backend framework
- **React** for the enhanced frontend experience
- **PostgreSQL** for robust data storage
- **Open Source Community** for all the amazing tools and libraries

## 📞 Contact

- **Developer**: AI Assistant (Primary Developer)
- **Repository**: [https://github.com/vikas1aggarwal/my-website-1](https://github.com/vikas1aggarwal/my-website-1)
- **Issues**: [GitHub Issues](https://github.com/vikas1aggarwal/my-website-1/issues)

---

**Note**: This system is designed to evolve from a simple project tracker into a comprehensive ERP solution. The modular architecture allows for incremental development and easy scaling as your business grows.
