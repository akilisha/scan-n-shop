# kerbdrop - Local Marketplace Platform

A proximity-based marketplace connecting local buyers and sellers through location-aware discovery.

## Quick Start

### 1. Environment Setup

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Then edit `.env` and add your actual credentials:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Finix Configuration (For payments)
VITE_FINIX_APPLICATION_ID=your_application_id
VITE_FINIX_ENVIRONMENT=sandbox
VITE_FINIX_USERNAME=your_username
VITE_FINIX_PASSWORD=your_password
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Getting Credentials

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your Project URL and anon public key
4. Run the database setup from `SUPABASE_SETUP.md`

### Finix Setup

1. Sign up at [finix.com](https://finix.com) for a marketplace account
2. Get your sandbox credentials from the dashboard
3. Follow the integration guide in `docs/FINIX_INTEGRATION_GUIDE.md`

## Features

- 🗺️ **Location-Based Discovery** - Find products and events nearby
- 🏪 **Seller Management** - Complete seller dashboard with inventory
- 💳 **Secure Payments** - Finix-powered payment processing
- 📱 **Mobile-First** - Progressive Web App design
- 🎨 **Custom Branding** - Sellers can customize their storefront
- 📊 **Analytics** - Performance insights for sellers

## Documentation

- [`docs/BUSINESS_DESIGN_DOCUMENT.md`](docs/BUSINESS_DESIGN_DOCUMENT.md) - Complete business model and architecture
- [`docs/FINIX_INTEGRATION_GUIDE.md`](docs/FINIX_INTEGRATION_GUIDE.md) - Payment processing setup
- [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) - Database configuration
- [`FINIX_BACKEND_REQUIREMENTS.md`](FINIX_BACKEND_REQUIREMENTS.md) - Backend API requirements

## Architecture

- **Frontend**: React + TypeScript + Vite
- **UI Components**: Tailwind CSS + Shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Finix Marketplace APIs
- **Maps**: React Leaflet + OpenStreetMap

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

See the deployment guides in the docs folder for platform-specific instructions.

## Support

For questions about the codebase, check the documentation in the `docs/` folder or review the business design document for architectural decisions.
