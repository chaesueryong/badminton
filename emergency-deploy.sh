#!/bin/bash

# Emergency deployment script for production
# Run this on your production server to quickly restore service

echo "🚨 Emergency deployment starting..."

# Navigate to project directory (adjust path as needed)
cd /home/ec2-user/badminton || cd /root/badminton || cd ~/badminton || {
    echo "❌ Cannot find project directory"
    echo "Please update the path in this script"
    exit 1
}

echo "📍 Current directory: $(pwd)"

# Pull latest code
echo "📥 Pulling latest code from main branch..."
git fetch origin
git checkout main
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build the application
echo "🔨 Building application..."
npm run build

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 found, using PM2 for deployment"

    # Stop existing process
    pm2 stop badminton-prod 2>/dev/null || true
    pm2 delete badminton-prod 2>/dev/null || true

    # Start with PM2
    PORT=3030 pm2 start npm --name "badminton-prod" -- start -- -p 3030

    # Save PM2 configuration
    pm2 save
    pm2 startup systemd -u $USER --hp /home/$USER

    # Show status
    pm2 list
    pm2 logs badminton-prod --lines 20

elif command -v docker &> /dev/null; then
    echo "🐳 Docker found, using Docker for deployment"

    # Stop and remove existing container
    docker stop badminton-prod 2>/dev/null || true
    docker rm badminton-prod 2>/dev/null || true

    # Build new image
    docker build -t badminton-prod:latest .

    # Run new container
    docker run -d \
        --name badminton-prod \
        -p 3030:3000 \
        --restart unless-stopped \
        badminton-prod:latest

    # Show logs
    docker logs -f badminton-prod --tail 50

else
    echo "⚠️ Neither PM2 nor Docker found, using direct Node.js"

    # Kill any existing Node.js process on port 3030
    lsof -ti:3030 | xargs kill -9 2>/dev/null || true

    # Start directly with Node.js (not recommended for production)
    nohup npm start -- -p 3030 > app.log 2>&1 &

    echo "Started with PID: $!"
    tail -f app.log
fi

echo "✅ Emergency deployment completed!"
echo "🌐 Application should be available at https://badmate.club"
echo ""
echo "📝 Next steps:"
echo "1. Check if the site is accessible"
echo "2. Monitor logs for any errors"
echo "3. Set up proper CI/CD pipeline to prevent this issue"