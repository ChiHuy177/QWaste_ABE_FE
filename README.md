# Qwaste v2 - Next.js Application with CI/CD

A modern Next.js application with automated CI/CD pipeline using GitHub Actions and DockerHub for seamless deployment.

## 🚀 Quick Start

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/get-started)
- [Git](https://git-scm.com/)

### Local Development
```bash
# Clone the repository
git clone https://github.com/DuckHweeee/Qwaste_v2.git
cd Qwaste_v2

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🐳 Docker Deployment

### Quick Deploy (Recommended)
```powershell
# Windows PowerShell
npm run deploy:local
```

```bash
# Linux/macOS/WSL
./scripts/deploy-local.sh
```

### Manual Docker Commands
```bash
# Build and run locally
npm run docker:build
npm run docker:run

# Using Docker Compose
docker-compose up --build

# With Nginx reverse proxy
npm run docker:prod
```

### Pull from DockerHub (After CI/CD)
```bash
docker pull duckhweeee/qwaste-v2:latest
docker run -p 3000:3000 duckhweeee/qwaste-v2:latest
```

## 🔄 CI/CD Pipeline

Our automated CI/CD pipeline runs on GitHub Actions and includes:

### 🧪 **Test & Build Stage**
- Runs on every push and pull request
- Node.js dependency installation
- ESLint code quality checks
- Production build validation
- Artifact upload for deployment

### 🐳 **Docker Build & Push Stage**
- Triggered on pushes to `master` branch
- Multi-platform builds (AMD64, ARM64)
- Automated push to DockerHub
- Smart tagging strategy:
  - `latest` for main branch
  - `master-{sha}` for commit-specific tags
  - `{branch}` for branch deployments

### 🚀 **Deployment Stage**
- Automated deployment notifications
- Container deployment instructions
- Health check validations
- Rollback procedures

## 📋 Available Scripts

### Development
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |

### Docker Operations
| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container |
| `npm run docker:dev` | Development with Docker Compose |
| `npm run docker:prod` | Production with Nginx proxy |
| `npm run deploy:local` | Full local deployment |

### CI/CD Scripts
| Script | Platform | Description |
|--------|----------|-------------|
| `scripts/deploy-local.ps1` | Windows | PowerShell deployment script |
| `scripts/deploy-local.sh` | Unix/Linux | Bash deployment script |

## ⚙️ Configuration Files

### Core Configuration
- **`next.config.ts`** - Next.js configuration with standalone output
- **`package.json`** - Dependencies and scripts
- **`tsconfig.json`** - TypeScript configuration
- **`eslint.config.js`** - Code quality rules

### Docker & Deployment
- **`Dockerfile`** - Multi-stage production build
- **`.dockerignore`** - Docker build exclusions
- **`docker-compose.yml`** - Local development orchestration
- **`nginx.conf`** - Reverse proxy configuration

### CI/CD Pipeline
- **`.github/workflows/ci-cd-simple.yml`** - GitHub Actions workflow
- **`.env.example`** - Environment variables template

## 🔧 Setup Instructions

### 1. GitHub Actions Setup

1. **Fork/Clone** this repository
2. **Enable GitHub Actions** in your repository settings
3. **Add DockerHub secrets**:
   ```
   DOCKERHUB_USERNAME: your-dockerhub-username
   DOCKERHUB_TOKEN: your-dockerhub-access-token
   ```

### 2. DockerHub Configuration

1. **Create DockerHub account** at [hub.docker.com](https://hub.docker.com)
2. **Create repository** named `qwaste-v2`
3. **Generate access token**:
   - Account Settings → Security → New Access Token
   - Select Read & Write permissions

### 3. Local Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
# Add any application-specific variables
```

## 🌊 Workflow Triggers

### Automatic Triggers
- **🔀 Pull Requests**: Test and build validation
- **📤 Push to master**: Full CI/CD with deployment
- **🔄 Manual**: GitHub Actions tab manual trigger

### Branch Strategy
- **`master`**: Production branch, full pipeline
- **`develop`**: Development branch, test only
- **`feature/*`**: Feature branches, PR validation

## 📊 Monitoring & Health Checks

### Application Health
```bash
# Check application status
curl http://localhost:3000

# View container logs
docker logs -f qwaste-v2-local

# Monitor resource usage
docker stats qwaste-v2-local
```

### Docker Compose Monitoring
```bash
# View all services
docker-compose ps

# Follow logs
docker-compose logs -f

# Check service health
docker-compose exec qwaste-v2 curl http://localhost:3000
```

## 🔐 Security Features

### Container Security
- ✅ **Non-root user** execution
- ✅ **Multi-stage builds** for minimal attack surface
- ✅ **Dependency vulnerability** scanning
- ✅ **Secrets management** via environment variables

### CI/CD Security
- ✅ **GitHub secrets** for sensitive data
- ✅ **Automated security** scanning
- ✅ **Branch protection** rules
- ✅ **Signed commits** support

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues
```bash
# Check Docker status
docker info

# Clean Docker system
docker system prune -a

# Reset Docker settings
docker builder prune
```

#### Port Conflicts
```bash
# Check what's using port 3000
netstat -tulpn | grep 3000  # Linux
netstat -ano | findstr 3000  # Windows

# Kill process using port
kill -9 $(lsof -t -i:3000)  # Linux
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Docker debug build
docker build --progress=plain --no-cache -t qwaste-v2 .
```

## 📈 Performance Optimization

### Build Optimization
- **Multi-stage Docker builds** reduce image size
- **GitHub Actions caching** speeds up builds
- **Dependency optimization** minimizes bundle size
- **Static file compression** improves load times

### Runtime Optimization
- **Next.js standalone output** for minimal runtime
- **Container resource limits** prevent resource exhaustion
- **Health checks** ensure service availability
- **Graceful shutdowns** maintain data integrity

## 🛠️ Development Workflow

### Feature Development
1. **Create feature branch** from `master`
2. **Develop locally** using `npm run dev`
3. **Test with Docker** using `npm run docker:dev`
4. **Create pull request** for code review
5. **Merge to master** triggers deployment

### Hotfix Process
1. **Create hotfix branch** from `master`
2. **Apply minimal changes** for quick fix
3. **Test locally** and with Docker
4. **Fast-track merge** to `master`
5. **Monitor deployment** for issues

## 🌐 Deployment Environments

### Local Development
- **URL**: http://localhost:3000
- **Hot reload**: Enabled
- **Debug mode**: Available

### Docker Local
- **URL**: http://localhost:3000
- **Production mode**: Enabled
- **Health checks**: Active

### Docker with Nginx
- **URL**: http://localhost:80
- **Load balancing**: Available
- **SSL termination**: Ready

## 📚 Additional Resources

### Documentation
- **[CI-CD-SETUP.md](./CI-CD-SETUP.md)** - Detailed CI/CD guide
- **[Next.js Docs](https://nextjs.org/docs)** - Framework documentation
- **[Docker Docs](https://docs.docker.com/)** - Container platform guide

### Community
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Community support and ideas
- **Pull Requests** - Contribute to the project

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. **Fork the repository**
2. **Create your feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📞 Support

- **Create an issue** for bug reports
- **Start a discussion** for questions
- **Check existing issues** before reporting

---

**Built with ❤️ using Next.js, Docker, and GitHub Actions**

*Last updated: November 2025*
