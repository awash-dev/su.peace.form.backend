# Samara Peace Forum API - Backend Server

Welcome to the server architecture for the **Samara Peace Forum**, handling database queries, user management, and dynamic CMS capabilities for the frontend UI. 

This repository relies on Express.js endpoints to manage our PostgreSQL (or relative SQL) persistence layers and interact with third-party image management architectures like Cloudinary.

## Tech Stack Overview

- **Runtime:** Node.js (v18+)
- **Routing Engine:** Express
- **Database Architecture:** PostgreSQL (Optimized for Supabase)
- **Media Uploads:** Cloudinary via Multer
- **Middleware:** CORS, Body-Parser
- **Local Dev:** Nodemon

## Services & Endpoints

This backend serves an organized REST architecture listening by default on `PORT 3000`.

- `/api/posts`: Manages Global News and updates (Create, Read, Update, Delete) for the forum.
- `/api/members`: Endpoints to Register, Delete, and Fetch dynamic members of the Student Registry. Supports Cloudinary multipart payload execution for ID Scans and Profile Photos.
- `/api/categories`: Controls the creation and deployment of dynamic inter-university Unions & Chapters.

## Database Operations 

We utilize a relational data layout (mapped via `/schema.sql`) enforcing critical integrity checks:
- Distinct, strictly formatted Institutional Email verification (`@su.edu.et`) to protect Student Registry ingestion.
- Enforced category linking (using Foreign Keys referencing the primary `categories` table layout).
- Table isolation explicitly enabled for Row Level Security (RLS) policies ahead of scaling to Supabase.

## Environment Variables

To operate the backend locally, you will need a `.env` file situated in the `/server` directory containing the following crucial parameters:

```env
PORT=3000
DATABASE_URL=postgres://your_dev_link_here
CLOUDINARY_CLOUD_NAME=your_cloud_tag
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

## Running the Server Locally

1. Setup Node.js dependencies via your package manager:
```bash
npm install
```

2. Establish local variables by duplicating the env structure listed above into `.env` and linking to your local DB or hosted Supabase database.

3. Run the development process watcher (Nodemon):
```bash
npm run dev
```

The server will automatically map incoming API calls matching your endpoints, relaying them directly to the frontend clients running usually on `http://localhost:5173`.
