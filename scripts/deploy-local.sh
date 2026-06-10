#!/bin/bash

# Qwaste v2 - Local Deployment Script
echo "🚀 Starting local deployment for Qwaste v2..."

# Configuration
IMAGE_NAME="qwaste-v2"
CONTAINER_NAME="qwaste-v2-local"
PORT="3000"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Function to check if container exists
container_exists() {
    docker ps -a --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"
}

# Function to check if container is running
container_running() {
    docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"
}

# Stop and remove existing container if it exists
if container_exists; then
    echo "🛑 Stopping existing container..."
    docker stop $CONTAINER_NAME > /dev/null 2>&1
    echo "🗑️  Removing existing container..."
    docker rm $CONTAINER_NAME > /dev/null 2>&1
fi

# Build the Docker image
echo "🔨 Building Docker image..."
if docker build -t $IMAGE_NAME .; then
    echo "✅ Docker image built successfully!"
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

# Run the container
echo "🏃 Starting container..."
if docker run -d --name $CONTAINER_NAME -p $PORT:3000 $IMAGE_NAME; then
    echo "✅ Container started successfully!"
    echo "🌐 Application is running at: http://localhost:$PORT"
    echo ""
    echo "📋 Container Information:"
    echo "   Name: $CONTAINER_NAME"
    echo "   Image: $IMAGE_NAME"
    echo "   Port: $PORT"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs: docker logs -f $CONTAINER_NAME"
    echo "   Stop container: docker stop $CONTAINER_NAME"
    echo "   Remove container: docker rm $CONTAINER_NAME"
else
    echo "❌ Failed to start container"
    exit 1
fi