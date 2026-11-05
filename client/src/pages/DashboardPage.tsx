
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { applicationApi, jobApi } from "../api/services";
import { getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

import type { Application, Job } from "../types";

import StatCard from "../components/StatCard";
import JobCard from "../components/JobCard";

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease,
    },
  },
};

type DashboardErrors = {
  jobs: string;
  applications: string;
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
}

function formatDate(date: string | Date) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    reviewing: "In review",
    shortlisted: "Shortlisted",
    accepted: "Accepted",
    rejected: "Rejected",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-warning-soft text-warning";

    case "reviewing":
      return "bg-info-soft text-info";

    case "shortlisted":
      return "bg-success-soft text-success";

    case "accepted":
      return "bg-success-soft text-success";

    case "rejected":
      return "bg-danger-soft text-danger";

    default:
      return "bg-sand-dark text-muted";
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="nx-skeleton h-3 w-28" />
          <div className="nx-skeleton h-9 w-64" />
          <div className="nx-skeleton h-4 w-72 max-w-full" />
        </div>

        <div className="nx-skeleton h-12 w-36 rounded-control" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-card border border-border bg-sand-light p-5"
          >
            <div className="nx-skeleton h-10 w-10 rounded-xl" />
            <div className="mt-5 nx-skeleton h-3 w-28" />
            <div className="mt-3 nx-skeleton h-8 w-16" />
            <div className="mt-3 nx-skeleton h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="rounded-card border border-border bg-sand-light p-6">
        <div className="nx-skeleton h-6 w-52" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="nx-skeleton h-20 w-full rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: typeof BriefcaseBusiness;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-sand-light px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wine-soft text-wine">
        <Icon size={25} />
      </div>

      <h3 className="mt-5 font-heading text-lg font-extrabold text-ink">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
        {description}
      </p>

      <Link
        to={actionTo}
        className="nx-button nx-button-primary mt-6"
      >
        {actionLabel}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [busy, setBusy] = useState(true);

  const [errors, setErrors] = useState<DashboardErrors>({
    jobs: "",
    applications: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setBusy(true);

      setErrors({
        jobs: "",
        applications: "",
      });

      const [jobsResult, applicationsResult] =
        await Promise.allSettled([
          jobApi.list({ limit: 3 }),
          applicationApi.mine(),
        ]);

      if (cancelled) return;

      if (jobsResult.status === "fulfilled") {
        setJobs(jobsResult.value.data.jobs ?? []);
      } else {
        setJobs([]);
        setErrors((previous) => ({
          ...previous,
          jobs: getApiError(jobsResult.reason),
        }));
      }

      if (applicationsResult.status === "fulfilled") {
        setApps(
          applicationsResult.value.data.applications ?? []
        );
      } else {
        setApps([]);
        setErrors((previous) => ({
          ...previous,
          applications: getApiError(
            applicationsResult.reason
          ),
        }));
      }

      setBusy(false);
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  const pendingCount = apps.filter((app) =>
    ["pending", "reviewing"].includes(app.status)
  ).length;

  const shortlistedCount = apps.filter(
    (app) => app.status === "shortlisted"
  ).length;

  const showMotion = !shouldReduceMotion;

  const activity = apps.slice(0, 4);

  return (
    <motion.div
      variants={containerVariants}
      initial={showMotion ? "hidden" : false}
      animate="visible"
      className="mx-auto w-full max-w-[1440px] space-y-9 pb-10"
    >
      {/* =========================================
          HEADER
      ========================================== */}

      <motion.section
        variants={showMotion ? itemVariants : undefined}
        className="relative overflow-hidden rounded-panel bg-wine-dark p-6 text-sand-light shadow-premium sm:p-9"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-sand/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-20 h-60 w-60 rounded-full border border-sand/10"
        />

        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />

              <span className="text-[10px] font-bold tracking-[2px] text-sand/70">
                YOUR PERSONAL WORKSPACE
              </span>
            </div>

            <h1 className="font-heading text-3xl font-extrabold tracking-[-1.5px] text-sand-light sm:text-4xl lg:text-5xl">
              {getGreeting()},{" "}
              <span className="font-editorial font-medium italic text-sand">
                {firstName}.
              </span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-7 text-sand/65">
              Your next opportunity could be closer than you
              think. Stay focused, explore new roles and keep
              moving forward.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/jobs"
                className="nx-button border border-sand bg-sand text-wine hover:bg-sand-light"
              >
                <Search size={16} />
                Explore opportunities
                <ArrowRight size={15} />
              </Link>

              <div className="flex items-center gap-2 rounded-control border border-sand/15 px-4 py-3 text-[10px] font-semibold text-sand/70">
                <CalendarDays size={14} />
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 items-center justify-center md:flex">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-sand/20 bg-sand/5">
              <div className="absolute inset-3 rounded-full border border-dashed border-sand/30" />

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sand text-wine shadow-wine">
                <Sparkles size={34} />
              </div>
            </div>
          </div>
        </div>
      </motion.section>


      {/* =========================================
          LOADING
      ========================================== */}

      {busy ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* =========================================
              STATISTICS
          ========================================== */}

          <motion.section
            variants={showMotion ? itemVariants : undefined}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-[9px] font-bold tracking-[2px] text-wine">
                  YOUR PROGRESS
                </span>

                <h2 className="mt-1 font-heading text-xl font-extrabold text-ink">
                  Career overview
                </h2>
              </div>

              <span className="hidden items-center gap-2 text-[10px] font-semibold text-muted sm:flex">
                <TrendingUp size={14} className="text-success" />
                Live account data
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Applications sent"
                value={errors.applications ? "—" : apps.length}
                hint="Your total applications"
                icon={FileCheck2}
              />

              <StatCard
                label="In review"
                value={errors.applications ? "—" : pendingCount}
                hint="Pending or being reviewed"
                icon={Clock3}
              />

              <StatCard
                label="Shortlisted"
                value={
                  errors.applications ? "—" : shortlistedCount
                }
                hint="Applications shortlisted"
                icon={Sparkles}
              />

              <StatCard
                label="New opportunities"
                value={errors.jobs ? "—" : jobs.length}
                hint="Latest jobs loaded"
                icon={BriefcaseBusiness}
              />
            </div>
          </motion.section>


          {/* =========================================
              API ERRORS
          ========================================== */}

          {(errors.jobs || errors.applications) && (
            <motion.div
              variants={showMotion ? itemVariants : undefined}
              role="alert"
              className="space-y-3"
            >
              {errors.jobs && (
                <div className="flex items-start gap-3 rounded-card border border-danger/20 bg-danger-soft p-4">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-danger"
                  />

                  <div>
                    <p className="text-sm font-bold text-danger">
                      Unable to load job opportunities
                    </p>
                    <p className="mt-1 text-xs text-danger/80">
                      {errors.jobs}
                    </p>
                  </div>
                </div>
              )}

              {errors.applications && (
                <div className="flex items-start gap-3 rounded-card border border-danger/20 bg-danger-soft p-4">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-danger"
                  />

                  <div>
                    <p className="text-sm font-bold text-danger">
                      Unable to load application activity
                    </p>
                    <p className="mt-1 text-xs text-danger/80">
                      {errors.applications}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}


          {/* =========================================
              JOB OPPORTUNITIES
          ========================================== */}

          <motion.section
            variants={showMotion ? itemVariants : undefined}
            className="space-y-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <span className="text-[9px] font-bold tracking-[2px] text-wine">
                  DISCOVER YOUR NEXT MOVE
                </span>

                <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-ink">
                  Recommended opportunities
                </h2>

                <p className="mt-2 text-sm text-muted">
                  Recently posted roles worth exploring.
                </p>
              </div>

              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 text-xs font-bold text-wine transition-colors hover:text-wine-dark"
              >
                Browse all jobs
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {errors.jobs ? (
              <div className="rounded-card border border-border bg-sand-light p-8 text-center">
                <RefreshCw
                  size={24}
                  className="mx-auto text-muted"
                />

                <p className="mt-3 text-sm font-semibold text-ink">
                  Job recommendations couldn't be loaded.
                </p>

                <Link
                  to="/jobs"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-wine"
                >
                  Open jobs page
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : jobs.length > 0 ? (
              <div className="job-list space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BriefcaseBusiness}
                title="No opportunities available"
                description="There are no jobs to display right now. Check the jobs page for available openings."
                actionLabel="Explore jobs"
                actionTo="/jobs"
              />
            )}
          </motion.section>


          {/* =========================================
              APPLICATION ACTIVITY
          ========================================== */}

          <motion.section
            variants={showMotion ? itemVariants : undefined}
            className="space-y-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <span className="text-[9px] font-bold tracking-[2px] text-wine">
                  TRACK YOUR JOURNEY
                </span>

                <h2 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-ink">
                  Application activity
                </h2>

                <p className="mt-2 text-sm text-muted">
                  Keep track of your latest applications.
                </p>
              </div>

              <Link
                to="/applications"
                className="inline-flex items-center gap-2 text-xs font-bold text-wine transition-colors hover:text-wine-dark"
              >
                View all applications
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {errors.applications ? (
              <div className="rounded-card border border-border bg-sand-light p-8 text-center">
                <AlertCircle
                  size={24}
                  className="mx-auto text-muted"
                />

                <p className="mt-3 text-sm font-semibold text-ink">
                  Application activity couldn't be loaded.
                </p>

                <Link
                  to="/applications"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-wine"
                >
                  Open applications
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : activity.length > 0 ? (
              <div className="overflow-hidden rounded-card border border-border bg-sand-light shadow-soft">
                <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                  <div>
                    <h3 className="text-sm font-bold text-ink">
                      Recent applications
                    </h3>

                    <p className="mt-1 text-[10px] text-muted">
                      Your latest {activity.length} applications
                    </p>
                  </div>

                  <div className="rounded-xl bg-wine-soft p-2 text-wine">
                    <FileCheck2 size={18} />
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {activity.map((app) => {
                    const job =
                      typeof app.job === "object" && app.job
                        ? app.job
                        : null;

                    const company = job?.company || "Company";
                    const companyInitial = company
                      .trim()
                      .charAt(0)
                      .toUpperCase() || "N";

                    return (
                      <div
                        key={app._id}
                        className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-sand sm:flex-row sm:items-center sm:px-6"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wine-soft font-heading text-base font-extrabold text-wine">
                            {companyInitial}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-bold text-ink">
                              {job?.title || "Job application"}
                            </h4>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted">
                              <span>{company}</span>

                              <span>·</span>

                              <span>
                                {formatDate(app.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold ${getStatusClass(
                              app.status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {getStatusLabel(app.status)}
                          </span>

                          <CheckCircle2
                            size={16}
                            className="shrink-0 text-subtle"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border px-5 py-4 text-center sm:px-6">
                  <Link
                    to="/applications"
                    className="inline-flex items-center gap-2 text-xs font-bold text-wine hover:text-wine-dark"
                  >
                    See all application activity
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={FileCheck2}
                title="Your journey starts here"
                description="You haven't applied to any jobs yet. Find a role that matches your skills and submit your first application."
                actionLabel="Find your first job"
                actionTo="/jobs"
              />
            )}
          </motion.section>


          {/* =========================================
              BOTTOM CAREER CTA
          ========================================== */}

          <motion.section
            variants={showMotion ? itemVariants : undefined}
            className="flex flex-col gap-5 rounded-card border border-border bg-sand-light p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-7"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-wine text-sand shadow-wine">
                <Sparkles size={22} />
              </div>

              <div>
                <h3 className="font-heading text-base font-extrabold text-ink">
                  Keep your career moving.
                </h3>

                <p className="mt-1 max-w-lg text-xs leading-6 text-muted">
                  Explore available positions and find opportunities
                  that match your career goals.
                </p>
              </div>
            </div>

            <Link
              to="/jobs"
              className="nx-button nx-button-primary shrink-0"
            >
              Explore jobs
              <ArrowRight size={15} />
            </Link>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
