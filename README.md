# GridMapper

A powerful web application for creating interactive grid overlays on maps and images. Perfect for tabletop gaming, urban planning, cartography, and any scenario where you need precise grid-based measurements and coordinates.

## 📸 Screenshots

### Main Application Interface
![Main Screen](screenshots/Main%20Screen.png)
*Create and edit maps with intuitive grid controls and real-time preview*

### Dashboard
![Dashboard](screenshots/Dashboard.png)
*Manage all your maps from a clean, organized dashboard*

### Map Workspace
![Map Screen](screenshots/Map%20Screen.png)
*Advanced map editing with slice controls, zoom/pan, and precise grid positioning*

### Map Sharing
![Share Map Screen](screenshots/Share%20map%20screen.png)
*Share your maps publicly with customizable access controls*

## 🚀 Features

### Core Functionality
- **📁 Image Upload**: Support for various image formats (PNG, JPG, WEBP) and PDF files with drag-and-drop interface
- **🔲 Interactive Grid System**: Customizable grid overlays with adjustable cell sizes and positioning
- **📍 Coordinate System**: Automatic coordinate labeling (A1, B2, etc.) with customizable reference points
- **🔍 Zoom & Pan**: Full zoom and pan functionality for detailed work with precise positioning
- **📤 Export Options**: High-quality export of gridded maps with customizable DPI settings

### Advanced Features
- **🗺️ Map Splitting**: Split large maps into multiple manageable slices for easier handling
- **⚙️ Slice-Specific Settings**: Individual zoom and pan settings for each map slice
- **📏 Reference Lines**: Thin reference lines for precise alignment and measurement
- **🎨 Smart Grid Colors**: Automatic brightness detection for optimal grid visibility
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Sharing & Collaboration
- **🔗 Map Sharing**: Share maps publicly with unique URLs
- **🔒 Access Control**: Optional access codes for private map sharing
- **👥 User Management**: Secure user accounts with authentication
- **💾 Cloud Storage**: All maps saved securely in the cloud

### User Experience
- **🔐 Password Reset**: Email and SMS-based password recovery
- **⚡ Real-time Updates**: Instant preview of all changes
- **🎯 Precision Tools**: Pixel-perfect grid alignment and positioning
- **📊 Export Consistency**: Exported images match exactly what you see on screen

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **UI Library**: React 18 with modern hooks
- **Styling**: Tailwind CSS for responsive design
- **Components**: Radix UI for accessible components
- **Icons**: Lucide React for consistent iconography

### Backend
- **API**: Next.js API routes with RESTful endpoints
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based secure authentication
- **File Processing**: PDF.js for PDF document support
- **Email Service**: Nodemailer for password reset emails
- **SMS Service**: ClickSend API for SMS notifications

### Infrastructure
- **Deployment**: Vercel for seamless CI/CD
- **Database Hosting**: Vercel Postgres or external PostgreSQL
- **File Storage**: Optimized for cloud deployment
- **Environment**: Production-ready configuration

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **PostgreSQL database** - For data storage
- **Git** - For version control
- **Code editor** - VS Code recommended

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/chrishaeNO/gridmappertool.git
cd gridmappertool
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```
Edit `.env` with your configuration (see Environment Variables section below)

4. **Set up the database:**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Run the development server:**
```bash
npm run dev
```

6. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

### Quick Start Guide

1. **Create an account** or log in
2. **Upload an image** or PDF file
3. **Adjust grid settings** (cell size, position, colors)
4. **Split map** into slices if needed
5. **Fine-tune each slice** with individual zoom/pan settings
6. **Export your gridded map** in high quality
7. **Share your map** with others using the share feature

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

### Required Variables
```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/gridmapper"

# Authentication Secrets
JWT_SECRET="your-secure-jwt-secret-key"
NEXTAUTH_SECRET="your-secure-nextauth-secret"
```

### Optional Variables
```bash
# Google AI Integration (for automatic brightness detection)
GOOGLE_GENAI_API_KEY="your-google-ai-api-key"

# Email Configuration (for password reset)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="GridMapper <noreply@gridmapper.com>"

# SMS Configuration (for password reset via SMS)
CLICKSEND_USERNAME="your-clicksend-username"
CLICKSEND_API_KEY="your-clicksend-api-key"
SMS_SENDER_NAME="GridMapper"
```

### Configuration Details

#### Google AI Integration
GridMapper includes an optional AI-powered automatic brightness detection feature:
- **Purpose**: Automatically adjusts grid colors based on image content
- **Setup**: Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Fallback**: If not provided, uses client-side brightness detection

#### Email Service
For password reset functionality via email:
- **Supported**: Gmail, Outlook, and other SMTP providers
- **Security**: Use app-specific passwords for Gmail
- **Optional**: App works without email configuration

#### SMS Service
For password reset functionality via SMS:
- **Provider**: ClickSend SMS API
- **Setup**: Create account at [ClickSend](https://www.clicksend.com/)
- **Optional**: App works without SMS configuration

## 🚀 Deployment

### Vercel Deployment (Recommended)

This application is optimized for Vercel deployment:

1. **Push to GitHub:**
```bash
git push origin main
```

2. **Connect to Vercel:**
   - Visit [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Configure project settings

3. **Environment Variables:**
   Add all required environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your production PostgreSQL URL
   - `JWT_SECRET` - Secure JWT secret
   - `NEXTAUTH_SECRET` - NextAuth secret
   - Optional: Email and SMS configuration

4. **Database Migration:**
```bash
# Apply migrations to production database
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

5. **Deploy:**
   Vercel automatically deploys on every push to main branch

### Alternative Deployment Options

- **Docker**: Dockerfile included for containerized deployment
- **Railway**: Compatible with Railway's PostgreSQL
- **Heroku**: Can be deployed with Heroku Postgres
- **Self-hosted**: Works with any Node.js hosting provider

## 📋 Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code analysis
- `npm run typecheck` - Run TypeScript type checking

### Database
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run database migrations (development)
- `npx prisma migrate deploy` - Deploy migrations (production)
- `npx prisma studio` - Open Prisma Studio database GUI

### Utilities
- `npm run clean` - Clean build artifacts
- `npm run reset-db` - Reset database (development only)

## 🎮 Use Cases

### Tabletop Gaming
- **D&D Battle Maps**: Create precise grids for combat encounters
- **Campaign Maps**: Split large world maps into manageable regions
- **Dungeon Layouts**: Add coordinates for easy reference during play

### Professional Applications
- **Urban Planning**: Grid overlay for city planning and zoning
- **Architecture**: Precise measurements and coordinate systems
- **Cartography**: Professional map creation with reference systems
- **Education**: Teaching coordinate systems and spatial relationships

### Creative Projects
- **Game Development**: Level design and asset placement
- **Art Projects**: Grid-based artwork and pixel art planning
- **Photography**: Composition guides and rule of thirds overlays

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch:**
```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes:**
   - Follow TypeScript best practices
   - Add tests for new functionality
   - Update documentation as needed

4. **Run quality checks:**
```bash
npm run lint
npm run typecheck
npm run build
```

5. **Submit a pull request:**
   - Provide clear description of changes
   - Include screenshots for UI changes
   - Reference any related issues

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and patterns
- Add JSDoc comments for complex functions
- Test on multiple browsers and devices
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For utility-first styling
- **Prisma** - For type-safe database access
- **Vercel** - For seamless deployment platform
- **PDF.js** - For PDF processing capabilities

---

**Built with ❤️ for the mapping community**

For support, feature requests, or bug reports, please [open an issue](https://github.com/chrishaeNO/gridmappertool/issues) on GitHub.
