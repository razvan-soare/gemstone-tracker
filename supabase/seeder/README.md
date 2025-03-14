# Gemstone Tracker Seeder Scripts

This directory contains scripts for seeding the database with test data.

## Seed Script

The `seed.js` script creates a test user, organization, and stone in the Supabase database.

### Prerequisites

- Node.js installed
- Supabase project set up
- `.env` file with Supabase credentials

### Installation

Make sure you have the required dependencies installed:

```bash
npm install @supabase/supabase-js dotenv
```

### Usage

Run the script from the project root:

```bash
node scripts/seed.js
```

Or make it executable and run directly:

```bash
chmod +x scripts/seed.js
./scripts/seed.js
```

### What the Script Does

1. Creates a test user with email `test@test.com` and password `flarflar` (if it doesn't exist)
2. Creates an organization for this user (if it doesn't exist)
3. Adds the user as an owner of the organization
4. Adds a test stone to the organization (if it doesn't have any)

### Test User Credentials

- **Email**: test@test.com
- **Password**: flarflar

You can use these credentials to log in to the application after running the seeder script.
