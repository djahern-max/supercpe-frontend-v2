#!/bin/bash

# SuperCPE Frontend Setup Script - JavaScript + CSS Modules
echo "🚀 Setting up SuperCPE Professional Frontend (JavaScript + CSS Modules)..."

# Check if we're in the right directory
if [[ ! $(basename "$PWD") == "supercpe-frontend" ]]; then
    echo "❌ Please run this from the supercpe-frontend directory"
    exit 1
fi

# Create React app with JavaScript (no TypeScript)
echo "📦 Creating React app with JavaScript..."
npx create-react-app .

# Install additional dependencies for our professional features
echo "📚 Installing professional UI and functionality packages..."
npm install \
    @stripe/stripe-js \
    @stripe/react-stripe-js \
    axios \
    react-router-dom \
    react-dropzone \
    clsx \
    date-fns \
    react-hot-toast

# Install development dependencies
npm install --save-dev \
    prettier \
    eslint-config-prettier

# Create directory structure
echo "📁 Creating professional directory structure..."
mkdir -p src/{components,pages,services,types,utils,hooks,styles}
mkdir -p src/components/{ui,layout,forms,dashboard}
mkdir -p src/styles/{components,pages,utils}

# Create CSS Modules structure
echo "🎨 Setting up CSS Modules structure..."
touch src/styles/globals.css
touch src/styles/variables.css
touch src/styles/utils/animations.module.css
touch src/styles/utils/layout.module.css

echo "✅ Setup complete! Next steps:"
echo "1. Set up CSS variables and global styles"
echo "2. Create professional components with CSS modules"
echo "3. Set up API integration"
echo "4. Configure Stripe payments"
echo ""
echo "Run the setup commands, then 'npm start' to begin development!"
