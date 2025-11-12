# Frontend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.development .env.local
   ```
   Edit `.env.local` and set your API URL:
   ```
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client and endpoint functions
│   │   ├── client.ts     # Axios client with interceptors
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── users.ts      # User endpoints
│   │   ├── mentors.ts    # Mentor endpoints
│   │   ├── sessions.ts   # Session endpoints
│   │   ├── feedback.ts   # Feedback endpoints
│   │   └── admin.ts      # Admin endpoints
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Reusable UI components
│   ├── pages/            # Page components
│   ├── store/            # Zustand state stores
│   ├── types/            # TypeScript definitions
│   ├── lib/              # Utility functions
│   └── App.tsx           # Main app with routing
├── public/               # Static assets
└── package.json          # Dependencies
```

## Key Features Implemented

✅ Authentication with JWT tokens  
✅ Role-based access control (Mentee, Mentor, Admin)  
✅ Role-specific dashboards  
✅ Mentor browsing and matching interface  
✅ Session booking and management  
✅ Feedback collection system  
✅ Profile management  
✅ Availability management (for mentors)  
✅ Admin analytics dashboard  
✅ Responsive design with Tailwind CSS  
✅ Error handling and loading states  
✅ Toast notifications  

## API Integration

The frontend is configured to work with the backend API as specified in `integration-guide.md`. All API calls:

- Use the base URL from `VITE_API_URL` environment variable
- Include authentication tokens automatically
- Handle token refresh automatically
- Follow the standard response format from the integration guide

## Testing

To test the application:

1. Ensure the backend API is running
2. Start the frontend dev server
3. Navigate to `http://localhost:3000`
4. Login with test credentials (provided by backend)

## Deployment

For production deployment:

1. Set `VITE_API_URL` to your production API URL
2. Run `npm run build`
3. Deploy the `dist` folder to your hosting service
4. Configure CORS on the backend to allow your frontend domain

## Notes

- Tokens are stored in localStorage (consider httpOnly cookies for production)
- All dates are handled in ISO 8601 format
- The app follows WCAG 2.1 AA accessibility guidelines
- Responsive design works on mobile, tablet, and desktop



