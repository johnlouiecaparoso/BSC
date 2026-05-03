# CSU Accomplishment Tracking System

A Vue.js-based Balanced Scorecard (BSC) performance tracking web application for Caraga State University offices.

## Tech Stack

- **Framework:** Vue 3 (Composition API with `<script setup>`)
- **Routing:** Vue Router 4
- **State Management:** Pinia
- **Styling:** Tailwind CSS
- **Charts:** Chart.js with vue-chartjs
- **Icons:** Lucide Vue Next
- **Form Validation:** VeeValidate + Yup
- **Notifications:** Vue Toastification
- **Build Tool:** Vite

## Project Setup

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── assets/           # CSS and static assets
├── components/       # Vue components
│   ├── common/       # Reusable UI components
│   ├── office/       # Office-specific components
│   ├── admin/        # Admin-specific components
│   └── charts/       # Chart components
├── composables/      # Composition API utilities
├── layouts/          # Layout components
├── pages/            # Page components
│   ├── auth/         # Authentication pages
│   ├── office/       # Office user pages
│   └── admin/        # Admin pages
├── router/           # Vue Router configuration
├── services/         # API service layer
├── stores/           # Pinia stores
└── utils/            # Utility functions
```

## User Roles

### Office Users
- View dashboard with accomplishment overview
- Manage office profile
- Set up BSC entries (KPIs)
- Enter quarterly performance data
- View notifications

### Admin Users
- View university-wide dashboard
- Manage all offices
- View detailed office reports
- Approve/reject office registrations
- Assign focal persons to entries
- View analytics and charts

## Key Features

### For Office Users
- **BSC Entry Setup:** Define goals, perspectives, strategic objectives, and KPIs
- **Quarterly Data Entry:** Enter performance data for each quarter (Q1-Q4)
- **Real-time Calculations:** Automatic calculation of total accomplishment and percentage
- **URL Validation:** MOV (Means of Verification) with URL validation
- **Progress Tracking:** Visual indicators for completion status

### For Admin Users
- **Office Management:** View and manage all registered offices
- **Advanced Filtering:** Filter by pillar, assignment type, quarter, status, etc.
- **Performance Analytics:** University-wide and office-specific charts
- **Approval System:** Review and approve office registrations
- **Focal Person Assignment:** Assign responsible persons to entries with issues
- **Alert System:** Flagged entries with issues but no focal person assigned

## Supabase Integration

This project is built with Supabase-ready service functions. All data fetching functions are placeholders that can be easily replaced with Supabase client calls without changing the component logic.

To integrate Supabase:
1. Install Supabase client: `npm install @supabase/supabase-js`
2. Create Supabase client instance
3. Update service functions in `src/services/` directory
4. Replace placeholder returns with actual Supabase queries

## Development Notes

- No mock data or hardcoded values in components
- All data flows through Pinia stores
- Service layer is ready for Supabase integration
- Form validation using VeeValidate + Yup
- Responsive design with Tailwind CSS
- Toast notifications for user feedback
- Navigation guards for role-based access control

## License

Proprietary - Caraga State University
