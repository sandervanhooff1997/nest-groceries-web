# Nest Groceries Web

A modern Next.js frontend for the Nest Groceries API. Authenticate with JWT and manage your shopping lists with an intuitive interface.

## Features

✅ **JWT Authentication** - Secure login with token-based authentication
✅ **Protected Routes** - Automatic redirection for unauthenticated users
✅ **Shopping Lists Management** - Create, view, and manage shopping lists
✅ **Shopping Items** - Add, edit, delete, and track items with quantities
✅ **Progress Tracking** - Visual progress bar showing list completion
✅ **Responsive Design** - Beautiful Tailwind CSS styling for all devices
✅ **Type-Safe** - Full TypeScript support throughout

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- Running Nest Groceries API (`http://127.0.0.1:3000/api`)

### Installation

```bash
cd nest-groceries-web

# Install dependencies
pnpm install

# Sync generated API client from backend
pnpm run contracts:pull

# Start development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Login

**Demo credentials (if seeded in API):**
- Email: `test@example.com`
- Password: `password123`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── login/page.tsx     # Login page
│   ├── dashboard/page.tsx # Shopping lists overview
│   └── shopping-lists/[id]/page.tsx  # Shopping list detail
├── components/            # Reusable components
│   └── protected-route.tsx # Route protection wrapper
├── lib/                    # Utilities and contexts
│   └── auth-context.tsx   # JWT auth provider
└── globals.css            # Global Tailwind styles
```

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000/api
```

## Available Scripts

```bash
# Development
pnpm run dev

# Production build
pnpm run build
pnpm run start

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Sync API client (after backend changes)
pnpm run contracts:pull
```

## API Integration

The app uses auto-generated TypeScript client from your OpenAPI spec. When you update the backend API:

```bash
# Pull latest generated client from backend
pnpm run contracts:pull
```

The generated client is placed in `src/api/generated/` (auto-synced from backend).

## Authentication Flow

1. User enters email/password on login page
2. Backend validates and returns JWT token
3. Token stored in localStorage
4. Token auto-injected in all API requests via `Authorization: Bearer <token>`
5. 401 responses trigger re-login redirect

## Protected Routes

All pages except `/` and `/login` are protected with the `<ProtectedRoute>` wrapper:

```tsx
<ProtectedRoute>
  {/* Content only visible to authenticated users */}
</ProtectedRoute>
```

## Building & Deploying

```bash
# Create optimized production build
pnpm run build

# Start production server
pnpm run start
```

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + Hooks
- **API Client**: Auto-generated from OpenAPI spec
- **Auth**: JWT with localStorage

## Troubleshooting

### Can't login
- Ensure API is running at `http://127.0.0.1:3000`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

### "Failed to fetch lists"
- Verify token is being sent with requests (check Network tab)
- Ensure user is authenticated
- Check API is returning 200 for `/shopping-lists`

### API client out of date
- Run `pnpm run contracts:pull` to regenerate from latest backend spec

## Contributing

1. Create a new branch for your feature
2. Make changes
3. Run `pnpm run type-check` and `pnpm run lint`
4. Submit PR

## License

UNLICENSED

