
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileCheck2,
  Plus,
  Users,
  Clock3,
  MapPin,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

import { applicationApi, jobApi } from "../api/services";
import { getApiError } from "../api/client";
import type { Job } from "../types";

export default function EmployerPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [countWarning, setCountWarning] = useState(false);

  const reduceMotion = useReducedMotion();

  const fetchDashboard = useCallback(async () => {
    setBusy(true);
    setError("");
    setCountWarning(false);

    try {
      const response = await jobApi.mine();
      const fetchedJobs: Job[] = response.data.jobs || [];

      setJobs(fetchedJobs);

      const countResults = await Promise.allSettled(
        fetchedJobs.map((job) => applicationApi.forJob(job._id))
      );

      let total = 0;
      let failed = false;

      countResults.forEach((result) => {
        if (result.status === "fulfilled") {
          total += Number(result.value.data.count) || 0;
        } else {
          failed = true;
        }
      });

      setApplications(total);
      setCountWarning(failed);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const activeJobs = jobs.filter((job) => job.isActive);
  const inactiveJobs = jobs.filter((job) => !job.isActive);

  const stats = [
    {
      label: "Jobs posted",
      value: jobs.length,
      hint: "All roles you've created",
      icon: BriefcaseBusiness,
      color: "bg-wine-soft text-wine",
    },
    {
      label: "Active listings",
      value: activeJobs.length,
      hint: "Currently accepting candidates",
      icon: FileCheck2,
      color: "bg-success-soft text-success",
    },
    {
      label: "Applications",
      value: applications,
      hint: "Across your job listings",
      icon: Users,
      color: "bg-info-soft text-info",
    },
    {
      label: "Inactive roles",
      value: inactiveJobs.length,
      hint: "Not currently active",
      icon: Clock3,
      color: "bg-warning-soft text-warning",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* Dashboard hero */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-panel bg-wine px-6 py-8 text-sand-light shadow-wine sm:px-9 sm:py-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-sand/10" />
        <div className="pointer-events-none absolute -right-5 -top-12 h-52 w-52 rounded-full border border-sand/10" />

        <div className="relative z-10 flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-sand/20 bg-sand/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-sand">
              <Building2 size={13} />
              Employer workspace
            </span>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Hiring overview<span className="text-sand">.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-sand/75 sm:text-base">
              Manage your job listings, review incoming applications, and
              move the right candidates forward.
            </p>
          </div>

          <Link
            to="/employer/jobs/new"
            className="inline-flex w-fit items-center gap-2 rounded-control bg-sand px-5 py-3 text-sm font-bold text-wine transition hover:bg-sand-light"
          >
            <Plus size={18} />
            Post a job
          </Link>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap gap-5 border-t border-sand/15 pt-5 text-xs font-semibold text-sand/75">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={15} className="text-sand" />
            {activeJobs.length} active roles
          </span>
          <span className="inline-flex items-center gap-2">
            <Users size={15} />
            {applications} applications received
          </span>
        </div>
      </motion.section>

      {/* Error */}
      {error && (
        <div className="flex flex-col gap-3 rounded-card border border-danger/20 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger" />
            <div>
              <p className="font-bold text-danger">
                Couldn't load your employer dashboard
              </p>
              <p className="mt-1 text-sm text-danger/80">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            disabled={busy}
            className="rounded-control bg-danger px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {/* Metrics */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-wine">
              Performance snapshot
            </span>
            <h2 className="mt-1 font-heading text-xl font-extrabold text-ink">
              Your hiring activity
            </h2>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            disabled={busy}
            aria-label="Refresh dashboard"
            className="inline-flex items-center gap-2 rounded-control border border-border bg-sand-light px-3 py-2 text-xs font-bold text-muted transition hover:border-wine/30 hover:text-wine disabled:opacity-50"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.label}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.06 }}
                className="rounded-card border border-border bg-sand-light p-4 shadow-soft transition hover:shadow-card sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-xl p-2.5 ${stat.color}`}>
                    <Icon size={19} />
                  </span>
                  <span className="text-xs font-semibold text-subtle">
                    Overview
                  </span>
                </div>

                <p className="mt-5 font-heading text-3xl font-extrabold tabular-nums text-ink">
                  {busy ? "—" : stat.value}
                </p>

                <p className="mt-1 text-xs font-bold text-ink sm:text-sm">
                  {stat.label}
                </p>

                <p className="mt-1 text-xs text-muted">{stat.hint}</p>
              </motion.div>
            );
          })}
        </div>

        {countWarning && !busy && (
          <p className="mt-3 flex items-center gap-2 text-xs text-warning">
            <AlertCircle size={14} />
            Some application counts couldn't be loaded. The displayed total
            may be incomplete.
          </p>
        )}
      </section>

      {/* Job listings */}
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-wine">
              Your hiring pipeline
            </span>
            <h2 className="mt-1 font-heading text-2xl font-extrabold text-ink">
              Recent job listings
            </h2>
            <p className="mt-1 text-sm text-muted">
              Manage your roles and review the candidates who applied.
            </p>
          </div>

          <Link
            to="/employer/jobs"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-wine transition hover:text-wine-dark"
          >
            Manage all jobs
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {busy ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-card border border-border bg-sand-light p-5"
              >
                <div className="h-12 w-12 rounded-xl bg-sand" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-sand" />
                  <div className="h-3 w-28 rounded bg-sand" />
                </div>
                <div className="h-7 w-20 rounded-full bg-sand" />
              </div>
            ))}
          </div>
        ) : !error && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.slice(0, 6).map((job, index) => (
              <motion.article
                key={job._id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.05 }}
                className="group rounded-card border border-border bg-sand-light p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-wine/20 hover:shadow-card sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-wine-soft text-wine">
                      <BriefcaseBusiness size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-base font-extrabold text-ink sm:text-lg">
                        {job.title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-wine">
                        {job.company}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} />
                          {job.location}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <BriefcaseBusiness size={14} />
                          {job.jobType}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {new Date(job.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 lg:border-0 lg:pt-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                        job.isActive
                          ? "bg-success-soft text-success"
                          : "bg-warning-soft text-warning"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          job.isActive ? "bg-success" : "bg-warning"
                        }`}
                      />
                      {job.isActive ? "Active" : "Inactive"}
                    </span>

                    <Link
                      to={`/employer/jobs/${job._id}/applicants`}
                      className="inline-flex items-center gap-1.5 rounded-control bg-wine px-4 py-2.5 text-xs font-bold text-sand-light transition hover:bg-wine-dark"
                    >
                      <Users size={14} />
                      View applicants
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}

            {jobs.length > 6 && (
              <div className="pt-2 text-center">
                <Link
                  to="/employer/jobs"
                  className="inline-flex items-center gap-2 rounded-control border border-border px-5 py-3 text-sm font-bold text-wine transition hover:border-wine/30 hover:bg-wine-soft"
                >
                  View all {jobs.length} job listings
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            )}
          </div>
        ) : !error ? (
          <div className="rounded-panel border border-dashed border-border bg-sand-light px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-soft text-wine">
              <BriefcaseBusiness size={28} />
            </div>

            <h3 className="mt-5 font-heading text-xl font-extrabold text-ink">
              Your hiring journey starts here
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              You haven't posted any jobs yet. Create your first listing to
              start attracting candidates.
            </p>

            <Link
              to="/employer/jobs/new"
              className="nx-button nx-button-primary mt-6 inline-flex items-center gap-2"
            >
              <Plus size={17} />
              Post your first job
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
