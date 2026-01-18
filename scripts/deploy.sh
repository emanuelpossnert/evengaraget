#!/bin/bash

# EventGaraget n8n Deployment Script
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 EventGaraget n8n Deployment"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy .env.example to .env and fill in your credentials"
    echo "   cp .env.example .env"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker and try again"
    exit 1
fi

echo "✅ Pre-flight checks passed"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose pull

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for n8n to be ready
echo "⏳ Waiting for n8n to start..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
    echo ""
    echo "🌐 Access n8n at: http://localhost:5678"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Import workflows from workflows/ directory"
    echo "   2. Configure credentials in n8n UI"
    echo "   3. Activate workflows"
    echo "   4. Test with a sample email"
    echo ""
    echo "📖 See SETUP_GUIDE.md for detailed instructions"
    echo ""
    echo "📋 View logs: docker-compose logs -f n8n"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check logs: docker-compose logs"
    exit 1
fi

