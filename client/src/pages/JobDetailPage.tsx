import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { applicationApi, jobApi } from "../api/services";
import { getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

import type { Job } from "../types";

import toast from "react-hot-toast";

function formatDate(value: string | Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function JobDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="nx-skeleton h-5 w-40" />

      <div className="rounded-panel border border-border bg-sand-light p-7">
        <div className="flex gap-5">
          <div className="nx-skeleton h-16 w-16 rounded-2xl" />

          <div className="flex-1 space-y-3">
            <div className="nx-skeleton h-3 w-28" />
            <div className="nx-skeleton h-8 w-2/3" />
            <div className="nx-skeleton h-4 w-1/3" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="nx-skeleton h-20 rounded-card" />
          <div className="nx-skeleton h-72 rounded-card" />
        </div>

        <div className="nx-skeleton h-96 rounded-card" />
      </div>
    </div>
  );
}

function JobNotFound({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-panel border border-border bg-sand-light px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-soft text-wine">
        <BriefcaseBusiness size={28} />
      </div>

      <h2 className="mt-5 font-heading text-2xl font-extrabold text-ink">
        Job opportunity unavailable
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        {message || "This job may have been removed or is no longer available."}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="nx-button nx-button-secondary"
        >
          <RefreshCw size={15} />
          Try again
        </button>

        <Link to="/jobs" className="nx-button nx-button-primary">
          Browse jobs
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");

  const [busy, setBusy] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Load job details.
  useEffect(() => {
    let cancelled = false;

    const loadJob = async () => {
      setBusy(true);
      setError("");
      setJob(null);

      if (!id) {
        setError("Invalid job reference.");
        setBusy(false);
        return;
      }

      try {
        const { data } = await jobApi.list({ limit: 100 });

        if (cancelled) return;

        const foundJob = data.jobs?.find((item) => item._id === id) ?? null;

        setJob(foundJob);

        if (!foundJob) {
          setError("This job may have been removed or is no longer available.");
        }
      } catch (err) {
        if (cancelled) return;
        setError(getApiError(err));
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    };

    void loadJob();

    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast.error("Please sign in before applying.");
      return;
    }

    if (user.role !== "seeker") {
      toast.error("Employer accounts cannot apply for jobs.");
      return;
    }

    if (!user.resumeUrl) {
      toast.error("Upload your resume in My profile before applying.");
      return;
    }

    if (!job) return;

    setApplying(true);

    try {
      await applicationApi.apply({
        jobId: id,
        resume: user.resumeUrl,
        coverLetter: coverLetter.trim(),
      });

      toast.success("Application submitted successfully!");
      setCoverLetter("");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setApplying(false);
    }
  };

  if (busy) {
    return <JobDetailSkeleton />;
  }

  if (!job) {
    return (
      <JobNotFound
        message={error}
        onRetry={() => setRefreshKey((value) => value + 1)}
      />
    );
  }

  const companyInitial = job.company?.trim().charAt(0).toUpperCase() || "C";

  const isSeeker = user?.role === "seeker";
  const hasResume = Boolean(user?.resumeUrl);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 pb-12">
      {/* BACK NAVIGATION */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-xs font-bold text-muted transition hover:text-wine"
      >
        <ArrowLeft size={16} />
        Back to opportunities
      </Link>

      {/* JOB HEADER */}
      <section className="relative overflow-hidden rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-wine/5"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-wine font-heading text-2xl font-extrabold uppercase text-sand shadow-wine">
            {companyInitial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-wine-soft px-3 py-1 text-[9px] font-extrabold tracking-[1.5px] text-wine">
                JOB OPPORTUNITY
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-[9px] font-bold text-success">
                <CheckCircle2 size={12} />
                Listed opportunity
              </span>
            </div>

            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {job.title}
            </h1>

            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted">
              <Building2 size={16} className="text-wine" />
              {job.company}
            </p>
          </div>

          <div className="hidden shrink-0 items-center justify-center rounded-2xl border border-border bg-sand p-4 text-wine sm:flex">
            <BriefcaseBusiness size={28} />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
        {/* LEFT COLUMN */}
        <div className="min-w-0 space-y-6">
          {/* JOB META */}
          <section className="grid grid-cols-2 gap-3 rounded-card border border-border bg-sand-light p-4 sm:grid-cols-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-wine-soft p-2 text-wine">
                <MapPin size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted">Location</p>
                <p className="mt-1 break-words text-xs font-bold text-ink">
                  {job.location || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-wine-soft p-2 text-wine">
                <BriefcaseBusiness size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted">Job type</p>
                <p className="mt-1 break-words text-xs font-bold text-ink">
                  {job.jobType || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-wine-soft p-2 text-wine">
                <Building2 size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted">
                  Experience
                </p>
                <p className="mt-1 break-words text-xs font-bold text-ink">
                  {job.experienceLevel || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-wine-soft p-2 text-wine">
                <CalendarDays size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted">
                  Posted on
                </p>
                <p className="mt-1 text-xs font-bold text-ink">
                  {formatDate(job.createdAt)}
                </p>
              </div>
            </div>
          </section>

          {/* DESCRIPTION */}
          <section className="rounded-card border border-border bg-sand-light p-5 shadow-soft sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
                <FileText size={19} />
              </div>

              <div>
                <h2 className="font-heading text-lg font-extrabold text-ink">
                  About this role
                </h2>
                <p className="text-[11px] text-muted">
                  Role description and responsibilities
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="whitespace-pre-line text-sm leading-8 text-muted">
                {job.description || "No job description provided."}
              </p>
            </div>

            <div className="my-7 h-px bg-border" />

            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-wine" />
                <h3 className="font-heading text-base font-extrabold text-ink">
                  Skills and qualifications
                </h3>
              </div>

              {job.skills?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-wine/10 bg-wine-soft px-3.5 py-2 text-xs font-bold text-wine"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  No specific skills listed.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: APPLICATION CARD */}
        <aside className="space-y-4 lg:sticky lg:top-[100px]">
          {/* SALARY */}
          <section className="rounded-card border border-border bg-sand-light p-6 shadow-soft">
            <span className="text-[9px] font-extrabold tracking-[2px] text-wine">
              COMPENSATION
            </span>

            <h2 className="mt-2 font-heading text-2xl font-extrabold text-ink">
              {job.salary || "Not disclosed"}
            </h2>

            <p className="mt-2 text-xs leading-5 text-muted">
              Salary information provided by the employer.
            </p>

            <div className="my-5 h-px bg-border" />

            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
              <ShieldCheck size={16} className="text-success" />
              Apply using your profile resume
            </div>
          </section>

          {/* APPLY */}
          <section className="rounded-card border border-border bg-sand-light p-6 shadow-soft">
            <h3 className="font-heading text-lg font-extrabold text-ink">
              Ready to apply?
            </h3>

            <p className="mt-2 text-xs leading-6 text-muted">
              Submit your application and take the next step in your career.
            </p>

            {!user ? (
              <div className="mt-5 space-y-4">
                <p className="rounded-control bg-wine-soft p-3 text-xs leading-5 text-wine">
                  Sign in with a job seeker account to apply for this
                  opportunity.
                </p>

                <Link
                  to="/login"
                  className="nx-button nx-button-primary w-full"
                >
                  Sign in to apply
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : !isSeeker ? (
              <div className="mt-5 rounded-control bg-warning-soft p-4">
                <p className="text-xs font-bold text-warning">
                  Employer account detected
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Employer accounts cannot apply to job listings.
                </p>
              </div>
            ) : (
              <form onSubmit={apply} className="mt-5 space-y-5">
                {/* RESUME */}
                <div>
                  <p className="mb-2 text-xs font-bold text-ink">Your resume</p>

                  {hasResume ? (
                    <div className="flex items-center gap-3 rounded-control border border-success/20 bg-success-soft p-3">
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-success"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-success">
                          Resume uploaded
                        </p>
                        <p className="mt-0.5 text-[10px] text-success/80">
                          Ready to attach to your application
                        </p>
                      </div>

                      {user.resumeUrl && (
                        <a
                          href={user.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View resume
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-control border border-warning/20 bg-warning-soft p-3">
                      <p className="text-xs font-bold text-warning">
                        Resume required
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-muted">
                        Upload your resume before applying.
                      </p>

                      <Link
                        to="/profile"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-wine"
                      >
                        Go to my profile
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>

                {/* COVER LETTER */}
                <div>
                  <label
                    htmlFor="coverLetter"
                    className="mb-2 block text-xs font-bold text-ink"
                  >
                    Cover letter
                    <span className="ml-1 font-medium text-muted">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    id="coverLetter"
                    rows={5}
                    maxLength={3000}
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    placeholder="Tell the employer why you're a good fit..."
                    className="w-full resize-y rounded-control border border-border bg-white p-3 text-xs leading-6 text-ink outline-none transition placeholder:text-subtle focus:border-wine focus:ring-4 focus:ring-wine/5"
                  />

                  <p className="mt-1 text-right text-[10px] text-muted">
                    {coverLetter.length}/3000
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={applying || !hasResume}
                  className="nx-button nx-button-primary w-full"
                >
                  {applying ? (
                    <>
                      <Clock3 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit application
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] leading-5 text-muted">
                  By applying, your profile resume and cover letter will be
                  shared with the employer.
                </p>
              </form>
            )}
          </section>

          <div className="flex items-start gap-3 rounded-card border border-border bg-sand p-4">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-wine" />
            <p className="text-[10px] leading-5 text-muted">
              Make sure your resume and profile information are up to date
              before submitting your application.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
