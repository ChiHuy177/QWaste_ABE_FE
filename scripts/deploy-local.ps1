# Qwaste v2 - Local Deployment Script (PowerShell)
Write-Host "🚀 Starting local deployment for Qwaste v2..." -ForegroundColor Green

# Configuration
$IMAGE_NAME = "qwaste-v2"
$CONTAINER_NAME = "qwaste-v2-local"
$PORT = "3000"

# Check if Docker is running
try {
    docker info | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Function to check if container exists
function Test-ContainerExists {
    param($ContainerName)
    $containers = docker ps -a --format "table {{.Names}}" | Select-String "^$ContainerName$"
    return $containers.Count -gt 0
}

# Stop and remove existing container if it exists
if (Test-ContainerExists -ContainerName $CONTAINER_NAME) {
    Write-Host "🛑 Stopping existing container..." -ForegroundColor Yellow
    docker stop $CONTAINER_NAME | Out-Null
    Write-Host "🗑️  Removing existing container..." -ForegroundColor Yellow
    docker rm $CONTAINER_NAME | Out-Null
}

# Build the Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Blue
docker build -t $IMAGE_NAME .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

# Run the container
Write-Host "🏃 Starting container..." -ForegroundColor Blue
docker run -d --name $CONTAINER_NAME -p "${PORT}:3000" $IMAGE_NAME
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container started successfully!" -ForegroundColor Green
    Write-Host "🌐 Application is running at: http://localhost:$PORT" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Container Information:" -ForegroundColor Yellow
    Write-Host "   Name: $CONTAINER_NAME"
    Write-Host "   Image: $IMAGE_NAME"
    Write-Host "   Port: $PORT"
    Write-Host ""
    Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
    Write-Host "   View logs: docker logs -f $CONTAINER_NAME"
    Write-Host "   Stop container: docker stop $CONTAINER_NAME"
    Write-Host "   Remove container: docker rm $CONTAINER_NAME"
} else {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    exit 1
}