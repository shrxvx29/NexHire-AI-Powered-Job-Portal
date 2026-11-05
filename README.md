# NexHire — AI-Powered Job Portal

NexHire is a full-stack job portal built with the MERN stack and TypeScript. It provides separate workflows for job seekers and employers, including job discovery, applications, job management, profile management, file uploads, and AI-assisted career tools.

> **Project status:** This repository contains the client and server applications. Configure the required third-party services and environment variables before running it locally.

## Table of contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Application structure](#application-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API overview](#api-overview)
- [Important implementation notes](#important-implementation-notes)
- [Security and production checklist](#security-and-production-checklist)
- [Contributing](#contributing)

## Features

### Job seekers

- Register and sign in as a job seeker.
- View a dashboard with application and job information.
- Browse and search job listings.
- Filter jobs by location, job type, and experience level.
- View job details and submit applications.
- Track submitted applications and their statuses.
- Manage profile details, skills, and biography.
- Upload a profile picture and a PDF resume.
- Use AI career chat for career-related assistance.
- Analyse resume text and compare it with a job description.
- Generate an AI-based job-match score.
- Generate a tailored cover letter from resume and job details.

### Employers

- Register and sign in as an employer.
- View the employer dashboard.
- Create, edit, and delete job listings.
- View and manage the employer's job listings.
- View applicants for a job.
- Update application statuses.
- Manage company information and upload a company logo.

### Shared application capabilities

- Role-protected seeker and employer areas.
- JWT-based authentication.
- MongoDB persistence through Mongoose.
- Cloudinary-backed resume, profile-picture, and company-logo uploads.
- Email delivery through Nodemailer and Gmail SMTP configuration.
- Responsive React interface with toast notifications and animated UI elements.

## Technology stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS 4 |
| UI and visualization | Lucide React, Framer Motion, React Hot Toast, Recharts, React Markdown |
| HTTP client | Axios |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| AI | Groq SDK — `openai/gpt-oss-120b` model configured in the server |
| File storage | Cloudinary, Multer |
| Email | Nodemailer with Gmail service |

## Application structure

```text
NexHire-AI-Powered-Job-Portal/
├── client/
│   ├── src/
│   │   ├── api/                # Axios client and API service methods
│   │   ├── components/         # Shared UI components and route guards
│   │   ├── context/            # Authentication context
│   │   ├── layouts/            # Public and authenticated layouts
│   │   ├── pages/              # Seeker, employer, auth, jobs and AI pages
│   │   ├── types/              # Frontend TypeScript types
│   │   ├── App.tsx             # Frontend routes
│   │   └── index.css           # Global styles
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── config/                 # MongoDB, Cloudinary and email configuration
│   ├── controllers/            # Route handlers and business logic
│   ├── middleware/             # Authentication and upload middleware
│   ├── models/                 # User, Job and Application models
│   ├── routes/                 # Express API routes
│   ├── types/                  # Express and Multer type declarations
│   ├── utils/                  # Email templates and utilities
│   ├── server.ts               # Express application entry point
│   └── package.json
│
└── README.md
```

## Prerequisites

Install or arrange the following before starting:

- Node.js (use Node.js 20.19+ or 22.12+ as recommended by the frontend setup notes).
- npm.
- A MongoDB database. MongoDB Atlas can be used.
- A Cloudinary account for uploaded files and images.
- A Groq API key for the AI endpoints.
- A Gmail account configured for SMTP/app-password access for email delivery.

## Getting started

Run the frontend and backend in separate terminals.

### 1. Clone the repository

```bash
git clone https://github.com/shrxvx29/NexHire-AI-Powered-Job-Portal.git
cd NexHire-AI-Powered-Job-Portal
```

### 2. Configure and start the backend

```bash
cd server
npm install
```

Create a `server/.env` file and add the variables listed in [Environment variables](#environment-variables). Do not commit this file.

Start the backend in development mode:

```bash
npm run dev
```

The server uses port `5000` by default. When it starts successfully, the root health endpoint is available at:

```text
http://localhost:5000/
```

Expected response:

```json
{
  "success": true,
  "message": "NexHire Backend Server Started Successfully"
}
```

### 3. Configure and start the frontend

Open a second terminal from the repository root:

```bash
cd client
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The default value in `client/.env.example` is:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The backend CORS configuration already allows this local frontend origin.

## Environment variables

### Backend — `server/.env`

Create this file inside the `server` directory. These variable names are read by the backend source code:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GROQ_API_KEY=your_groq_api_key

EMAIL_USER=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
```

Notes:

- `MONGODB_URI` must point to the database you want NexHire to use.
- `JWT_SECRET` is used to sign authentication tokens. Use a long, unpredictable value and keep it private.
- The Cloudinary credentials are required by the upload configuration.
- The AI controller is configured to use the Groq model `openai/gpt-oss-120b`.
- Email is configured with Nodemailer's Gmail service. Use an appropriate Gmail app password; do not put your normal account password in source code.
- `CLIENT_URL` must be the deployed frontend origin when hosting the frontend elsewhere. The local Vite origin is allowed by default.
- `PORT` defaults to `5000` if omitted. `NODE_ENV` controls production error-message behavior.

### Frontend — `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

For deployment, set `VITE_API_URL` to the public backend API base URL. Variables prefixed with `VITE_` are bundled into the browser application and must never contain secrets.

## Available scripts

### Client (`client/`)

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript checking and create a production frontend build |
| `npm run preview` | Preview the production build locally |

### Server (`server/`)

| Command | Description |
|---|---|
| `npm run dev` | Run the backend with `tsx watch` |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled backend from `dist/server.js` |

To build both applications, run `npm run build` separately inside `client/` and `server/`.

## API overview

All API routes are prefixed with `/api`.

| Area | Method | Endpoint | Access |
|---|---|---|---|
| Authentication | `POST` | `/auth/register` | Public |
| Authentication | `POST` | `/auth/login` | Public |
| Authentication | `GET` | `/auth/me` | Authenticated |
| Profile | `PATCH` | `/auth/profile` | Authenticated |
| Employer profile | `GET` | `/auth/employer-profile` | Employer |
| Employer profile | `PATCH` | `/auth/employer-profile` | Employer |
| Jobs | `GET` | `/jobs` | Public |
| Employer jobs | `GET` | `/jobs/my-jobs` | Employer |
| Jobs | `POST` | `/jobs` | Employer |
| Jobs | `PATCH` | `/jobs/:id` | Employer |
| Jobs | `DELETE` | `/jobs/:id` | Employer |
| Applications | `POST` | `/applications` | Authenticated (seeker role checked by controller) |
| Applications | `GET` | `/applications/my-applications` | Authenticated |
| Applicants | `GET` | `/applications/job/:jobId` | Employer |
| Application status | `PATCH` | `/applications/:applicationId/status` | Employer |
| Resume upload | `POST` | `/uploads/resume` | Authenticated |
| Profile picture | `POST` | `/uploads/profile-picture` | Authenticated |
| Company logo | `POST` | `/uploads/company-logo` | Employer |
| AI career chat | `POST` | `/ai/career-chat` | Authenticated |
| Resume analysis | `POST` | `/ai/analyse-resume` | Authenticated |
| Job match score | `POST` | `/ai/job-match-score` | Authenticated |
| Cover letter | `POST` | `/ai/generate-cover-letter` | Authenticated |

Protected endpoints expect the JWT authorization token in the request as implemented by the frontend API client and backend authentication middleware.

## Important implementation notes

These points describe limitations visible in the current codebase; they are not claims about planned functionality:

- **Job detail endpoint:** The backend currently exposes `GET /api/jobs` but does not define a dedicated `GET /api/jobs/:id` route. The frontend job detail page resolves a job using the public jobs listing. This is workable for a small dataset but should be replaced with a dedicated detail endpoint as the application grows.
- **AI resume analysis input:** The AI endpoints accept resume text and job information in the request body. The current implementation does not extract text directly from an uploaded PDF.
- **Resume access:** Resume files are uploaded to Cloudinary and the returned URL is stored on the user record. A `secure_url` uses HTTPS, but that alone does not make a resume private. Review Cloudinary delivery/access controls before using real candidate data.
- **Employer registration:** Public registration currently accepts both `seeker` and `employer` roles. A production hiring platform should consider employer verification or an approval workflow.
- **Email configuration:** The backend email module requires `EMAIL_USER` and `EMAIL_PASSWORD` to be configured.

## Security and production checklist

Before deploying or using real candidate/employer data:

- Keep `.env` files, API keys, database credentials, JWT secrets, and SMTP credentials out of Git.
- Rotate any credential that has ever been committed or shared publicly.
- Restrict resume delivery and authorize access to candidate documents; do not treat public Cloudinary URLs as private.
- Add rate limiting and abuse protection to authentication and AI endpoints.
- Validate uploaded file content/signatures on the server, not only the supplied MIME type or file extension.
- Add employer verification or admin approval before allowing employer accounts to publish jobs.
- Ensure public job queries return only active listings.
- Test authorization and ownership checks for job editing, applicant access, and application status changes.
- Add automated tests for authentication, validation, duplicate applications, invalid IDs, upload failures, and role permissions.
- Configure `CLIENT_URL` and `VITE_API_URL` to match the actual deployed frontend and backend origins.

## Contributing

Contributions and issue reports are welcome. For a change:

1. Fork the repository.
2. Create a focused feature branch.
3. Make and test your changes in the relevant application (`client/` or `server/`).
4. Open a pull request with a clear summary and testing notes.

## License

No root-level license file was present in the supplied project archive. Unless a license is added, the repository should not be assumed to grant permission for reuse, redistribution, or modification.
