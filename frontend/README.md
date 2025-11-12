# Office Hours Matching Tool - Frontend

Frontend application for the Capital Factory Office Hours Matching Tool, built with React, TypeScript, and Tailwind CSS.

## Features

- **Authentication & Authorization**: Secure login with JWT tokens and role-based access control
- **Role-Specific Dashboards**: Customized dashboards for Mentees, Mentors, and Admins
- **Mentor Matching**: AI-powered mentor matching with match scores and reasoning
- **Session Management**: Book, view, and manage mentorship sessions
- **Feedback System**: Post-session feedback collection and ratings
- **Profile Management**: User profile editing with Airtable sync status
- **Admin Analytics**: Platform analytics and data export for administrators

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **date-fns** - Date utilities
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.development .env.local
```

3. Update `.env.local` with your API URL:
```
VITE_API_URL=http://localhost:8000/api/v1
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api/           # API client and endpoints
│   ├── components/    # Reusable UI components
│   │   ├── layout/    # Layout components (Navbar, ProtectedRoute)
│   │   └── ui/        # UI components (Button, Input, Card, etc.)
│   ├── pages/         # Page components
│   ├── store/         # State management (Zustand stores)
│   ├── types/         # TypeScript type definitions
│   ├── lib/           # Utility functions
│   ├── App.tsx        # Main app component with routing
│   └── main.tsx       # Entry point
├── public/            # Static assets
├── index.html         # HTML template
└── package.json       # Dependencies and scripts
```

## API Integration

The frontend is designed to work with the backend API as specified in the integration guide. All API calls are made through the `apiClient` which handles:

- Authentication token management
- Automatic token refresh
- Error handling
- Request/response interceptors

## Environment Variables

- `VITE_API_URL` - Backend API base URL (default: `http://localhost:8000/api/v1`)
- `VITE_ENV` - Environment (development/production)

## Features by Role

### Mentee
- Browse and search mentors
- View mentor profiles with match scores
- Book mentorship sessions
- View upcoming and past sessions
- Submit feedback after sessions

### Mentor
- Set availability slots
- View and accept/decline session requests
- Manage upcoming sessions
- View feedback and ratings
- Track utilization metrics

### Admin
- View platform analytics
- Manage users
- View all sessions
- Export data (CSV/JSON)

## Authentication

The app uses JWT tokens stored in localStorage (in production, consider httpOnly cookies for better security). Tokens are automatically refreshed when they expire.

## Routing

- `/login` - Login page
- `/dashboard/mentee` - Mentee dashboard
- `/dashboard/mentor` - Mentor dashboard
- `/dashboard/admin` - Admin dashboard
- `/mentors` - Browse mentors
- `/mentors/:id` - Mentor detail page
- `/sessions` - View all sessions
- `/sessions/:id` - Session detail
- `/sessions/:id/feedback` - Submit feedback
- `/profile` - User profile
- `/availability` - Manage availability (mentors only)

## Development Notes

- All API endpoints follow the `/api/v1/` prefix
- Error handling is centralized in the API client
- Toast notifications are used for user feedback
- Loading states are shown during async operations
- Forms use React Hook Form for validation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - Capital Factory



