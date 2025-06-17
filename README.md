# README.md
# SuperCPE Professional Frontend

A modern React application for professional CPE management designed specifically for New Hampshire CPAs.

## 🚀 Features

- **AI-Powered Certificate Analysis** - Upload certificates and extract CPE data automatically
- **Professional Dashboard** - Track compliance status and progress
- **Freemium Model** - Free analysis, premium storage and features
- **Mobile Responsive** - Works seamlessly on all devices
- **Professional Design** - Clean, modern interface built with CSS modules

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **CSS Modules** - Scoped styling for maintainable CSS
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Beautiful notifications
- **React Dropzone** - File upload with drag & drop

## 📦 Installation

```bash
# Clone the repository
cd supercpe-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm start
```

## 🔧 Development

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Format code
npm run format

# Lint code
npm run lint
```

## 🌐 Environment Variables

Create a `.env.local` file:

```bash
# For local development with backend running on localhost:8000
REACT_APP_API_URL=http://localhost:8000

# For production
REACT_APP_API_URL=https://nh.supercpe.com
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable React components
│   ├── ui/             # Basic UI components (Button, Card, etc.)
│   └── layout/         # Layout components (Header, Footer)
├── pages/              # Page components (Home, Dashboard, etc.)
├── services/           # API services and utilities
├── styles/             # CSS modules
│   ├── components/     # Component-specific styles
│   ├── pages/         # Page-specific styles
│   └── utils/         # Utility CSS classes
├── utils/              # JavaScript utilities
└── hooks/              # Custom React hooks
```

## 🎨 Styling

This project uses **CSS Modules** for styling:

- Global styles in `src/styles/globals.css`
- CSS variables in `src/styles/variables.css`
- Component styles in `src/styles/components/ComponentName.module.css`
- Page styles in `src/styles/pages/PageName.module.css`

## 🔗 API Integration

The frontend connects to the SuperCPE backend API:

- **Development**: `http://localhost:8000`
- **Production**: `https://nh.supercpe.com`

Key endpoints:
- `GET /api/cpas/{license_number}` - Get CPA information
- `POST /api/admin/analyze-certificate/{license_number}` - AI analysis (FREE)
- `POST /api/admin/save-reviewed-certificate/{license_number}` - Save record (PREMIUM)
- `GET /api/payments/subscription-status/{license_number}` - Check subscription

## 🚀 Deployment

```bash
# Build for production
npm run build

# The build folder is ready to deploy to any static hosting service
# (Netlify, Vercel, AWS S3, etc.)
```

## 🔄 User Flow

1. **Home Page** - Enter CPA license number
2. **Dashboard** - View compliance status and records
3. **Upload Page** - Upload certificate for AI analysis
4. **Review** - Edit AI-extracted data
5. **Save** - Subscribe to save permanently (or use free analysis)

## 🎯 Key Features

### Free Tier
- AI certificate analysis
- Basic compliance lookup
- Professional dashboard view

### Professional Tier ($58/year)
- Permanent record storage
- Advanced compliance reports
- Secure document management
- Priority support

## 📱 Responsive Design

- Mobile-first CSS approach
- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🛡️ Security

- Environment variables for sensitive data
- HTTPS in production
- Secure API communication
- Client-side input validation

## 📈 Performance

- Code splitting with React.lazy (can be added)
- Optimized images and assets
- Efficient re-renders with React best practices
- CSS modules for optimal bundle size

## 🤝 Contributing

1. Follow the existing code style
2. Use CSS modules for styling
3. Write meaningful commit messages
4. Test on multiple devices/browsers

## 📞 Support

For technical support or questions:
- Email: support@supercpe.com
- API Documentation: https://nh.supercpe.com/docs

---

Built with ❤️ for New Hampshire CPAs