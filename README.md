# GridMapper

A powerful web application for creating interactive grid overlays on maps and images. Perfect for tabletop gaming, urban planning, and any scenario where you need precise grid-based measurements and coordinates.

## Features

- **Image Upload**: Support for various image formats and PDF files
- **Interactive Grid System**: Customizable grid overlays with adjustable cell sizes
- **Coordinate System**: Automatic coordinate labeling (A1, B2, etc.)
- **Map Sharing**: Share maps publicly with optional access codes
- **Zoom & Pan**: Full zoom and pan functionality for detailed work
- **Export Options**: Export your gridded maps
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **File Processing**: PDF.js for PDF support
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Environment variables (see .env.example)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GridMapper
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and other required variables
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## Deployment

This application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

This project is licensed under the MIT License.
