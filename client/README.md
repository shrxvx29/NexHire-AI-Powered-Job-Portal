# NexHire React + TypeScript frontend

A Vite + React + TypeScript frontend built against the uploaded NexHire Express/MongoDB backend. The UI is light-theme, responsive, and uses real API calls. No mock jobs, mock auth, or hard-coded demo dashboard data are used.

## 1. Requirements

- Node.js 20.19+ or 22.12+
- The NexHire backend running locally (default `http://localhost:5000`)
- MongoDB and the backend's required environment variables configured

## 2. Install and run

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, copy the environment template with:

```powershell
Copy-Item .env.example .env
```

`.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the backend in a separate terminal using its existing `npm run dev` command. Vite normally serves this frontend at `http://localhost:5173`, which is already in the backend's CORS allow-list.

For deployment, set `VITE_API_URL` to the deployed backend API URL and set the backend `CLIENT_URL` to the deployed frontend origin. Vite variables are public client-side values; never put JWT secrets, Groq keys, Mongo credentials or Cloudinary secrets in this frontend `.env`.

## 3. Implemented screens

### Public/auth
- Sign in
- Create account with seeker/employer role selection (the backend currently permits both roles)

### Seeker
- Dashboard with live application counts and recent jobs
- Job discovery with search, location, job type, experience filters and pagination
- Job detail and application submission
- Application history and status tracking
- Profile editing, profile picture upload, PDF resume upload
- AI career chat
- AI resume analysis
- AI job-match score
- AI cover-letter generation

### Employer
- Hiring overview
- Create, edit and delete job listings
- Manage job listings
- View applicants per job
- Update applicant status

## 4. Backend API mapping

| Frontend feature | Backend route |
|---|---|
| Register / login / current user | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Update profile | `PATCH /api/auth/profile` |
| Browse jobs | `GET /api/jobs` |
| Employer's jobs | `GET /api/jobs/my-jobs` |
| Create/update/delete job | `POST /api/jobs`, `PATCH /api/jobs/:id`, `DELETE /api/jobs/:id` |
| Apply / applicant history | `POST /api/applications`, `GET /api/applications/my-applications` |
| Job applicants / status | `GET /api/applications/job/:jobId`, `PATCH /api/applications/:applicationId/status` |
| Resume / profile image | `POST /api/uploads/resume`, `POST /api/uploads/profile-picture` |
| AI | `/api/ai/career-chat`, `/api/ai/analyse-resume`, `/api/ai/job-match-score`, `/api/ai/generate-cover-letter` |

## 5. Important integration notes / backend changes

The uploaded backend does not currently expose a public `GET /api/jobs/:id` endpoint. The job detail screen currently resolves a job from the public listing endpoint (`GET /api/jobs?limit=100`) so it works for the current project size, but that is not a scalable detail lookup. Add a dedicated `getJobById` controller and `router.get('/:id', getJobById)` before the `/:id` PATCH/DELETE routes, then change the frontend detail page to call it.

Suggested controller:

```ts
export const getJobById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const job = await Job.findOne({ _id: req.params.id, isActive: true }).populate('createdBy', 'name');
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid job ID' });
  }
};
```

The current public jobs controller does not filter `isActive: true`; add that condition so inactive listings are not exposed as active opportunities.

The current application endpoint requires the client to submit a `resume` URL. This frontend uploads a PDF first and then sends the returned `user.resumeUrl`. The backend should ideally read the resume URL from the authenticated user's record instead of trusting a URL supplied by the browser.

The current AI resume endpoints accept extracted/plain resume text, not a PDF file. The frontend therefore asks the user to paste resume text. PDF parsing is not silently faked here; if you want upload-and-analyse, add server-side PDF text extraction to the backend.

## 6. Security items before production

- Do not allow unrestricted public employer registration. The current backend accepts `role: 'employer'` at registration. Add company verification or admin approval.
- Resume URLs are currently stored as Cloudinary `secure_url`; HTTPS does not make them private. Use authenticated delivery or short-lived signed URLs and authorize employer access.
- Add rate limiting to login/register and especially the AI endpoints.
- Validate file signatures, not only client-provided MIME types.
- Filter inactive jobs in public listing queries.
- Add integration tests for ownership, roles, invalid IDs, duplicate applications and status changes.

## 7. Build

```bash
npm run build
npm run preview
```

## 8. Source layout

- `src/api/` — Axios client and typed endpoint functions
- `src/context/` — authentication state and session bootstrap
- `src/components/` — reusable UI and protected route
- `src/layouts/` — responsive app shell/sidebar
- `src/pages/` — seeker, employer, authentication and AI screens
- `src/types/` — frontend contracts matching the backend models
