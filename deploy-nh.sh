#!/bin/bash

# SuperCPE New Hampshire Frontend Deployment Script
# Simplified for NH-only focus with main API at supercpe.com

set -e  # Exit on any error

# Configuration
REMOTE_SERVER="supercpe"  # Using SSH config alias
REMOTE_USER="root"
FRONTEND_PATH="/var/www/html/nh"
LOCAL_BUILD_PATH="./build"
MAIN_API="https://supercpe.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're in the React project directory
check_project_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
        print_error "Please run this script from your React project root directory"
        print_error "Expected to find: package.json and src/ directory"
        exit 1
    fi
    
    print_success "Found React project structure"
}

# Investigate current server setup
investigate_server() {
    print_status "Investigating New Hampshire server setup..."
    
    if ! ssh -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_SERVER" "echo 'SSH connection successful'" 2>/dev/null; then
        print_error "Cannot connect to $REMOTE_SERVER"
        print_error "Please check your SSH configuration and ensure you can connect:"
        print_error "ssh $REMOTE_USER@$REMOTE_SERVER"
        exit 1
    fi
    
    echo ""
    echo "=========================================="
    echo "NEW HAMPSHIRE SERVER INVESTIGATION"
    echo "=========================================="
    
    ssh "$REMOTE_USER@$REMOTE_SERVER" << 'EOF'
        echo "🖥️  SERVER INFO"
        echo "Hostname: $(hostname)"
        cat /etc/os-release | grep PRETTY_NAME
        echo ""
        
        echo "📁 WEB DIRECTORIES"
        for dir in "/var/www" "/var/www/html" "/usr/share/nginx" "/home/www"; do
            if [[ -d "$dir" ]]; then
                echo "✅ $dir exists:"
                ls -la "$dir" 2>/dev/null | head -10
                echo ""
            fi
        done
        
        echo "🌐 NGINX STATUS"
        if systemctl is-active --quiet nginx; then
            echo "✅ Nginx is running"
            echo "Version: $(nginx -v 2>&1)"
            echo ""
            echo "Current sites enabled:"
            ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled directory"
        else
            echo "❌ Nginx is not running or not installed"
        fi
        echo ""
        
        echo "🔒 SSL CERTIFICATES"
        if command -v certbot &> /dev/null; then
            echo "✅ Certbot available"
            certbot certificates 2>/dev/null | grep -A5 -B2 "nh.supercpe.com" || echo "No NH certificates found"
        else
            echo "❌ Certbot not found"
        fi
        echo ""
        
        echo "🔌 ACTIVE PORTS"
        echo "Web-related listening ports:"
        ss -tlnp | grep -E ':(80|443|8000)' || echo "No standard web ports found"
        echo ""
        
        echo "🐍 BACKEND PROCESSES"
        echo "Looking for running backend processes..."
        ps aux | grep -E "(python|uvicorn|gunicorn)" | grep -v grep || echo "No Python web processes found"
        echo ""
        
        echo "📄 CURRENT NGINX CONFIG"
        if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
            echo "Current default config (first 20 lines):"
            head -20 /etc/nginx/sites-enabled/default
        else
            echo "No default nginx config found"
        fi
EOF
    
    echo "=========================================="
    print_success "Investigation complete!"
}

# Build React application for New Hampshire
build_react_app() {
    print_status "Building React application for New Hampshire..."
    
    # Check if .env.production exists
    if [[ ! -f ".env.production" ]]; then
        print_warning ".env.production file not found"
        print_status "Creating .env.production with default NH configuration..."
        
        cat > .env.production << 'EOF'
# State Configuration
REACT_APP_STATE_CODE=NH
REACT_APP_STATE_NAME="New Hampshire"
REACT_APP_STATE_FULL_NAME="New Hampshire"

# API Configuration - Point to main API
REACT_APP_API_URL=https://supercpe.com
REACT_APP_ENVIRONMENT=production

# State-specific features
REACT_APP_OPLC_NAME="New Hampshire OPLC"
REACT_APP_CPA_LICENSE_FORMAT="NH-####"
REACT_APP_ENABLE_STATE_SPECIFIC_FEATURES=true

# Contact/Support
REACT_APP_SUPPORT_EMAIL=nh-support@supercpe.com
REACT_APP_SUPPORT_PHONE="(603) 555-0123"

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DEBUG=false

# Build Optimization
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
EOF
        print_success "Created .env.production file"
    else
        print_success "Found existing .env.production file"
    fi
    
    # Clean previous build
    if [[ -d "$LOCAL_BUILD_PATH" ]]; then
        rm -rf "$LOCAL_BUILD_PATH"
        print_status "Cleaned previous build"
    fi
    
    # Show configuration from .env.production
    print_status "Building with configuration from .env.production:"
    if command -v grep &> /dev/null; then
        grep "^REACT_APP_" .env.production | head -5 | while read line; do
            echo "  $line"
        done
    fi
    echo ""
    
    # Set NODE_ENV and build
    export NODE_ENV=production
    npm run build
    
    if [[ -d "$LOCAL_BUILD_PATH" ]]; then
        print_success "Build completed successfully!"
        echo "Build size: $(du -sh $LOCAL_BUILD_PATH | cut -f1)"
        echo "Files created: $(find $LOCAL_BUILD_PATH -type f | wc -l)"
    else
        print_error "Build failed - no build directory created"
        exit 1
    fi
}

# Create nginx configuration for NH
setup_nginx_config() {
    print_status "Setting up Nginx configuration for New Hampshire..."
    
    ssh "$REMOTE_USER@$REMOTE_SERVER" << EOF
        # Backup existing config if it exists
        if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
            cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup.\$(date +%Y%m%d_%H%M%S)
            echo "✅ Backed up existing nginx config"
        fi
        
        # Create NH-specific nginx configuration
        cat > /etc/nginx/sites-available/nh-supercpe << 'NGINXCONF'
# SuperCPE New Hampshire Frontend Configuration
server {
    listen 80;
    server_name nh.supercpe.com www.nh.supercpe.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nh.supercpe.com www.nh.supercpe.com;
    
    # SSL Configuration (existing Let's Encrypt certs)
    ssl_certificate /etc/letsencrypt/live/nh.supercpe.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nh.supercpe.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-SuperCPE-State "NH" always;
    
    # Performance optimizations
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # React Frontend (New Hampshire)
    location / {
        root $FRONTEND_PATH;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets aggressively
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Don't cache the main HTML file
        location = /index.html {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
    
    # Proxy API requests to main SuperCPE API
    location /api/ {
        proxy_pass https://supercpe.com/api/;
        proxy_ssl_verify on;
        proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host supercpe.com;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-SuperCPE-State "NH";
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Proxy documentation access
    location ~ ^/(docs|redoc|openapi.json)\$ {
        proxy_pass https://supercpe.com\$request_uri;
        proxy_ssl_verify on;
        proxy_set_header Host supercpe.com;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-SuperCPE-State "NH";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "SuperCPE NH - Healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Favicon handling
    location /favicon.ico {
        root $FRONTEND_PATH;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Robots.txt
    location /robots.txt {
        root $FRONTEND_PATH;
        access_log off;
    }
}
NGINXCONF
        
        echo "✅ Created nginx configuration"
        
        # Create frontend directory with proper permissions
        mkdir -p $FRONTEND_PATH
        chown -R www-data:www-data $FRONTEND_PATH
        chmod -R 755 $FRONTEND_PATH
        echo "✅ Created frontend directory: $FRONTEND_PATH"
        
        # Test the new configuration
        nginx -t
        echo "✅ Nginx configuration test passed"
EOF
}

# Deploy the built React app to the server
deploy_frontend() {
    print_status "Deploying React frontend to New Hampshire server..."
    
    # Create deployment archive
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    ARCHIVE_NAME="nh-frontend-${TIMESTAMP}.tar.gz"
    
    print_status "Creating deployment archive..."
    tar -czf "$ARCHIVE_NAME" -C "$LOCAL_BUILD_PATH" .
    
    # Upload to server
    print_status "Uploading to server..."
    scp "$ARCHIVE_NAME" "$REMOTE_USER@$REMOTE_SERVER:/tmp/"
    
    # Deploy on server
    ssh "$REMOTE_USER@$REMOTE_SERVER" << EOF
        # Create backup of current frontend if it exists
        if [[ -d "$FRONTEND_PATH" && "\$(ls -A $FRONTEND_PATH 2>/dev/null)" ]]; then
            cp -r "$FRONTEND_PATH" "${FRONTEND_PATH}.backup.\$(date +%Y%m%d_%H%M%S)"
            echo "✅ Backed up current frontend"
        fi
        
        # Extract new frontend
        cd "$FRONTEND_PATH"
        rm -rf ./* 2>/dev/null || true
        tar -xzf "/tmp/$ARCHIVE_NAME" -C .
        
        # Set proper permissions
        chown -R www-data:www-data .
        chmod -R 755 .
        
        # Clean up
        rm "/tmp/$ARCHIVE_NAME"
        
        echo "✅ Frontend deployed successfully"
        echo "Deployed files:"
        ls -la
EOF
    
    # Clean up local archive
    rm "$ARCHIVE_NAME"
    
    print_success "Frontend deployment completed!"
}

# Activate the new nginx configuration
activate_nginx_config() {
    print_status "Activating nginx configuration..."
    
    ssh "$REMOTE_USER@$REMOTE_SERVER" << EOF
        # Enable the new site
        ln -sf /etc/nginx/sites-available/nh-supercpe /etc/nginx/sites-enabled/
        
        # Remove default site if it exists
        if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
            rm /etc/nginx/sites-enabled/default
            echo "✅ Removed default nginx site"
        fi
        
        # Test and reload nginx
        nginx -t
        systemctl reload nginx
        
        echo "✅ Nginx configuration activated"
EOF
}

# Verify the deployment is working
verify_deployment() {
    print_status "Verifying deployment..."
    
    echo ""
    echo "🧪 Testing New Hampshire SuperCPE deployment:"
    echo "   Frontend: https://nh.supercpe.com"
    echo "   API: https://nh.supercpe.com/api"
    echo "   Health: https://nh.supercpe.com/health"
    echo "   Docs: https://nh.supercpe.com/docs"
    echo ""
    
    # Test endpoints if curl is available
    if command -v curl &> /dev/null; then
        print_status "Running connectivity tests..."
        
        # Test frontend
        if curl -s -o /dev/null -w "%{http_code}" https://nh.supercpe.com | grep -q "200"; then
            print_success "✅ Frontend responding (200 OK)"
        else
            print_warning "⚠️  Frontend may have issues"
        fi
        
        # Test health endpoint
        if curl -s https://nh.supercpe.com/health | grep -q "Healthy"; then
            print_success "✅ Health check passed"
        else
            print_warning "⚠️  Health check failed"
        fi
        
        # Test API connectivity
        if curl -s -o /dev/null -w "%{http_code}" https://nh.supercpe.com/api | grep -q "200\|404"; then
            print_success "✅ API proxy responding"
        else
            print_warning "⚠️  API proxy may have issues"
        fi
    else
        print_warning "curl not available - manual testing required"
    fi
    
    echo ""
    print_success "🎉 New Hampshire SuperCPE is now live!"
    print_status "Visit: https://nh.supercpe.com"
}

# Show help information
show_help() {
    echo "SuperCPE New Hampshire Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  investigate  - Check current server setup"
    echo "  build        - Build React app locally"
    echo "  configure    - Set up nginx configuration"
    echo "  deploy       - Deploy built app to server"
    echo "  activate     - Enable nginx configuration"
    echo "  verify       - Test the deployment"
    echo "  full         - Run complete deployment (build + configure + deploy + activate + verify)"
    echo "  help         - Show this help"
    echo ""
    echo "Prerequisites:"
    echo "  - SSH access to nh.supercpe.com"
    echo "  - React app in current directory"
    echo "  - Node.js and npm installed"
    echo ""
    echo "Examples:"
    echo "  $0 investigate      # Check what's on the server"
    echo "  $0 full             # Complete deployment"
    echo ""
}

# Main function
main() {
    case "${1:-help}" in
        investigate)
            investigate_server
            ;;
        build)
            check_project_directory
            build_react_app
            print_success "Build complete! Run '$0 deploy' to deploy to server."
            ;;
        configure)
            setup_nginx_config
            print_success "Configuration ready! Run '$0 deploy' to deploy frontend."
            ;;
        deploy)
            check_project_directory
            if [[ ! -d "$LOCAL_BUILD_PATH" ]]; then
                print_error "No build found. Run '$0 build' first."
                exit 1
            fi
            deploy_frontend
            print_success "Deployment complete! Run '$0 activate' to enable."
            ;;
        activate)
            activate_nginx_config
            verify_deployment
            ;;
        verify)
            verify_deployment
            ;;
        full)
            print_status "🚀 Starting complete New Hampshire deployment..."
            check_project_directory
            build_react_app
            setup_nginx_config
            deploy_frontend
            activate_nginx_config
            verify_deployment
            print_success "🎉 Complete deployment finished!"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run with all arguments
main "$@"