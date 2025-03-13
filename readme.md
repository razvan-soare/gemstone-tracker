---
description: Gemstone Tracker - A comprehensive application for tracking and managing gemstone collections
---

# Gemstone Tracker 💎

A modern application for tracking, cataloging, and managing your gemstone collection. Built with Expo, React Native, and Supabase.

## Features

- 📱 Cross-platform support (iOS, Android, Web)
- 💾 Secure cloud storage for your gemstone data
- 📊 Advanced filtering and sorting capabilities
- 📷 Image management for gemstone photos
- 📤 Export functionality for your collection data
- 🔍 Powerful search functionality

## Tech Stack

- [Expo](https://expo.dev/) - React Native framework
- [Supabase](https://supabase.com/) - Backend and database
- [React Query](https://tanstack.com/query) - Data fetching and caching
- [NativeWind](https://www.nativewind.dev/) - Tailwind CSS for React Native
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Zod](https://zod.dev/) - Schema validation

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Yarn](https://yarnpkg.com/) package manager
- [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)
- [Supabase Account](https://supabase.com/)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=<Your Supabase URL>
   EXPO_PUBLIC_SUPABASE_KEY=<Your Supabase Key>
   ```

### Installation

```bash
# Install dependencies
yarn install

# Start the development server
yarn start
```

### Running on Different Platforms

```bash
# Run on iOS
yarn ios

# Run on Android
yarn android

# Run on Web
yarn web
```

## Development

### Database Schema Generation

To generate TypeScript types from your Supabase schema:

```bash
yarn generate:types
```

### Deployment

#### Web

```bash
# Build for web
yarn web:build
```

#### Mobile (EAS)

```bash
# Deploy to preview
yarn deploy:preview

# Deploy to production
yarn deploy:production

# Deploy to all channels with version bump
yarn deploy:all
```

## Supabase

Access Supabase Studio at http://127.0.0.1:54323

# Reset local database (applies all migrations)

supabase db reset

# To apply the new migration to your local database:

supabase migration up

# Push changes to production (after approval)

supabase db push

# Pull production schema

supabase db pull

# Start/Stop local instance

supabase start
supabase stop

## Project Structure

- `/app` - Expo Router application routes
- `/components` - Reusable UI components
- `/lib` - Utility functions and API clients
- `/hooks` - Custom React hooks
- `/context` - React context providers
- `/constants` - Application constants
- `/assets` - Static assets (images, fonts)
- `/supabase` - Supabase configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
