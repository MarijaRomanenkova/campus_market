# Campmar - Campus Marketplace

A Next.js-based marketplace platform that connects students on campus to trade their second-hand items. Built with modern web technologies including Next.js 15, Prisma, PostgreSQL, Socket.io, and payment integrations.

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed on your system

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MarijaRomanenkova/campus_market.git
   cd campus_market
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory for sensitive API keys (this file is gitignored):
   ```bash
   # Required: NextAuth Secret
   # Generate one with: npx auth secret
   AUTH_SECRET=your-generated-secret-here

   # Optional: Stripe Payment Integration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...

   # Optional: Email Service (Resend)
   RESEND_API_KEY=re_...

   # Optional: File Upload (UploadThing)
   UPLOADTHING_SECRET=sk_live_...
   ```
   
   **Note:** The app will run without optional keys, but those features will not work. See [Environment Variables](#-environment-variables) section for details.

3. **Start the application:**
   ```bash
   docker compose up -d
   ```

4. **Access the application:**
   - **Main App**: http://localhost:3000
   - **Socket Server**: http://localhost:3001
   - **Database**: localhost:5432

5. **Stop the application:**
   ```bash
   docker compose down
   ```

## 🐳 Docker Services

The application consists of four main services:

- **app** - Next.js application (port 3000)
- **socket** - Socket.io server for real-time messaging (port 3001)
- **db** - PostgreSQL database (port 5432)
- **test** - Test container for running tests

## 👤 Test Users

The database is automatically seeded with test users on first startup. All users have the password: `password123`

| Email | Password | Role |
|-------|----------|------|
| `alex@campus.edu` | `password123` | user |
| `admin@campus.edu` | `password123` | admin |
| `sam@campus.edu` | `password123` | user |

**Note:** Only emails ending with `@campus.edu` are accepted for registration.

## 📦 Seeded Data

The database is pre-populated with:

- **3 Categories**: Electronics, Clothing, Furniture
- **3 Users**: See Test Users section above
- **8 Products**: Refrigerator, Laptop, Washing Machine, Coat, Jeans, Table, Chair, Bed
- **2 Product Assignments**: Sample assignments for testing

## 🔧 Environment Variables

### Required Variables

These are automatically set in `docker-compose.yml` for local development:

- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://postgres:postgres@db:5432/campus_market`)
- `NEXTAUTH_URL` - Authentication callback URL (default: `http://localhost:3000`)
- `NEXTAUTH_SECRET` - **Must be set in `.env.local`** (see setup instructions)
- `SOCKET_URL` - Socket.io server URL (default: `http://socket:3001`)
- `NEXT_PUBLIC_SOCKET_URL` - Public Socket.io URL (default: `http://localhost:3001`)

### Optional Variables (Add to `.env.local`)

These services require API keys to work fully, but the app will run without them:

1. **Stripe Payment Integration**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - ⚠️ Payment features will not work without these

2. **Email Service (Resend)**
   - `RESEND_API_KEY` - Resend API key
   - ⚠️ Email notifications/verification will not work without this

3. **File Upload (UploadThing)**
   - `UPLOADTHING_SECRET` - UploadThing secret key
   - ⚠️ File uploads will not work without this

**Where to add them:**
- Create a `.env.local` file in the root directory
- Add your API keys there (one per line)
- This file is gitignored and won't be committed to the repository

**Generate NextAuth Secret:**
```bash
npx auth secret
```
This will automatically generate a secure secret and add it to `.env.local`.

## 🛠️ Docker Commands

- `docker compose up -d` - Start all services in background
- `docker compose up` - Start all services with logs
- `docker compose down` - Stop all services
- `docker compose down -v` - Stop and remove all volumes (resets database)
- `docker compose logs` - View logs from all services
- `docker compose logs app` - View logs from Next.js app
- `docker compose logs socket` - View logs from Socket server
- `docker compose logs db` - View logs from PostgreSQL
- `docker compose restart` - Restart all services
- `docker compose build` - Rebuild Docker images
- `docker compose up -d --build` - Rebuild and start services

## 📚 Features

- **User Authentication** - Email/password with NextAuth.js (only `@campus.edu` emails accepted)
- **Product Listings** - Create, browse, and manage second-hand item listings
- **Categories** - Electronics, Clothing, Furniture
- **Real-time Chat** - Socket.io powered messaging between buyers and sellers
- **Payment Processing** - Stripe and PayPal integration
- **File Uploads** - Image uploads for products
- **Email Notifications** - Transactional emails via Resend
- **Admin Dashboard** - User and system management
- **Responsive Design** - Mobile-friendly interface

## 🏗️ Project Structure

```
campmar/
├── app/                    # Next.js app directory
│   ├── (auth)/           # Authentication pages
│   ├── (root)/           # Public pages
│   ├── admin/            # Admin dashboard
│   ├── api/              # API routes
│   └── user/             # User dashboard
├── components/            # React components
├── lib/                  # Utility functions and configurations
├── prisma/               # Database schema and migrations
├── socket/               # Socket.io server
├── db/                   # Database utilities and seed file
├── tests/                # Test files
└── docker-compose.yml    # Docker Compose configuration
```

## 🔍 Troubleshooting

### Services not starting
```bash
# Check logs
docker compose logs

# Restart services
docker compose restart
```

### Database connection errors
```bash
# Check database logs
docker compose logs db

# Restart database
docker compose restart db
```

### Socket connection issues
```bash
# Check socket server logs
docker compose logs socket

# Verify socket server is running
curl http://localhost:3001/socket-health
```

### Reset everything
```bash
# Stop and remove all containers and volumes
docker compose down -v

# Start fresh (will re-seed database)
docker compose up -d
```

### Reset database only
```bash
# Reset database and re-run migrations + seed
docker compose up -d db
docker compose run --rm app npx prisma migrate reset
```

## 🧪 Running Tests

To run tests, you can use the test container:

```bash
# Run tests in the test container
docker compose run --rm test npm test
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS, shadcn/ui
- **Payments**: Stripe, PayPal
- **Email**: Resend
- **File Upload**: UploadThing
- **Containerization**: Docker, Docker Compose

## 📄 License

This project is private and proprietary.

---

**Need help?** Check the troubleshooting section or create an issue in the repository.
