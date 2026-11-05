
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Trash2,
  Search,
  BriefcaseBusiness,
  MapPin,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  Pencil,
  FileCheck2,
  Clock3,
  X,
  Users2,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";

import { jobApi } from "../api/services";
import { getApiError } from "../api/client";
import type { Job } from "../types";

type Filter = "all" | "active" | "inactive";

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCompanyInitial(company?: string) {
  return company?.trim()?.charAt(0)?.toUpperCase() || "C";
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const reduceMotion = useReducedMotion();

  const load = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const response = await jobApi.mine();
      setJobs(response.data.jobs || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const fetchJobs = async () => {
      setBusy(true);
      setError("");

      try {
        const response = await jobApi.mine();

        if (active) {
          setJobs(response.data.jobs || []);
        }
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setBusy(false);
      }
    };

    fetchJobs();

    return () => {
      active = false;
    };
  }, []);

  const activeJobs = jobs.filter((job) => job.isActive);
  const inactiveJobs = jobs.filter((job) => !job.isActive);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "active" && job.isActive) ||
        (activeFilter === "inactive" && !job.isActive);

      const matchesSearch =
        !query ||
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.jobType?.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [jobs, search, activeFilter]);

  const remove = async () => {
    if (!selectedJob || deletingId) return;

    const id = selectedJob._id;

    setDeletingId(id);

    try {
      await jobApi.remove(id);

      setJobs((previous) =>
        previous.filter((job) => job._id !== id)
      );

      setSelectedJob(null);
      toast.success("Job listing deleted");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* Hero */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-panel bg-wine px-6 py-8 text-sand-light shadow-wine sm:px-9 sm:py-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-sand/10" />
        <div className="pointer-events-none absolute -right-5 -top-12 h-52 w-52 rounded-full border border-sand/10" />

        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-sand/20 bg-sand/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-sand">
              <BriefcaseBusiness size={13} />
              Recruitment management
            </span>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Manage your jobs<span className="text-sand">.</span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-sand/75 sm:text-base">
              Organize your published opportunities, update listings, and
              manage your candidate pipeline.
            </p>
          </div>

          <Link
            to="/employer/jobs/new"
            className="inline-flex w-fit items-center gap-2 rounded-control bg-sand px-5 py-3 text-sm font-bold text-wine transition hover:bg-sand-light"
          >
            <Plus size={18} />
            Create listing
          </Link>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap gap-5 border-t border-sand/15 pt-5 text-xs font-semibold text-sand/75">
          <span className="inline-flex items-center gap-2">
            <BriefcaseBusiness size={15} />
            {jobs.length} total listings
          </span>
          <span className="inline-flex items-center gap-2">
            <FileCheck2 size={15} />
            {activeJobs.length} active
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 size={15} />
            {inactiveJobs.length} inactive
          </span>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          {
            label: "All listings",
            value: jobs.length,
            icon: BriefcaseBusiness,
            color: "bg-wine-soft text-wine",
          },
          {
            label: "Active jobs",
            value: activeJobs.length,
            icon: FileCheck2,
            color: "bg-success-soft text-success",
          },
          {
            label: "Inactive jobs",
            value: inactiveJobs.length,
            icon: Clock3,
            color: "bg-warning-soft text-warning",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.06 }}
              className="rounded-card border border-border bg-sand-light p-4 shadow-soft sm:p-5"
            >
              <span className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
                <Icon size={19} />
              </span>

              <p className="mt-4 font-heading text-3xl font-extrabold tabular-nums text-ink">
                {busy ? "—" : stat.value}
              </p>

              <p className="mt-1 text-xs font-semibold text-muted sm:text-sm">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </section>

      {/* Listings */}
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-wine">
              Your recruitment pipeline
            </span>
            <h2 className="mt-1 font-heading text-2xl font-extrabold text-ink">
              Published listings
            </h2>
            <p className="mt-1 text-sm text-muted">
              {jobs.length} job listings in your workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={busy}
            className="inline-flex w-fit items-center gap-2 rounded-control border border-border bg-sand-light px-4 py-2.5 text-sm font-bold text-muted transition hover:border-wine/30 hover:text-wine disabled:opacity-50"
          >
            <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex flex-col gap-3 rounded-card border border-danger/20 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger" />
              <div>
                <p className="font-bold text-danger">
                  Couldn't load your job listings
                </p>
                <p className="mt-1 text-sm text-danger/80">{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={busy}
              className="rounded-control bg-danger px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search and filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search job title, company or location..."
              className="nx-input w-full pl-11"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              [
                ["all", "All"],
                ["active", "Active"],
                ["inactive", "Inactive"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveFilter(value)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                  activeFilter === value
                    ? "bg-wine text-sand-light shadow-wine"
                    : "border border-border bg-sand-light text-muted hover:border-wine/30 hover:text-wine"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
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
        ) : !error && filteredJobs.length > 0 ? (
          <div className="space-y-3">
            {filteredJobs.map((job, index) => (
              <motion.article
                key={job._id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.04 }}
                className="rounded-card border border-border bg-sand-light p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-wine/20 hover:shadow-card sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  {/* Job details */}
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-wine text-lg font-extrabold text-sand">
                      {getCompanyInitial(job.company)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-base font-extrabold text-ink sm:text-lg">
                          {job.title}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
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
                      </div>

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
                          Posted {formatDate(job.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-medium text-subtle">
                        Experience: {job.experienceLevel}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 lg:border-0 lg:pt-0">
                    <Link
                      to={`/employer/jobs/${job._id}/applicants`}
                      className="inline-flex items-center gap-1.5 rounded-control bg-wine px-3.5 py-2.5 text-xs font-bold text-sand-light transition hover:bg-wine-dark"
                    >
                      <UsersIcon />
                      Applicants
                      <ArrowUpRight size={14} />
                    </Link>

                    <Link
                      to={`/employer/jobs/${job._id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-control border border-border px-3.5 py-2.5 text-xs font-bold text-muted transition hover:border-wine/30 hover:text-wine"
                    >
                      <Pencil size={14} />
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      disabled={deletingId === job._id}
                      className="inline-flex items-center gap-1.5 rounded-control border border-danger/20 px-3.5 py-2.5 text-xs font-bold text-danger transition hover:bg-danger-soft disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : !error ? (
          <div className="rounded-panel border border-dashed border-border bg-sand-light px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-soft text-wine">
              <BriefcaseBusiness size={28} />
            </div>

            <h3 className="mt-5 font-heading text-xl font-extrabold text-ink">
              {jobs.length === 0
                ? "No job listings yet"
                : "No matching listings"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              {jobs.length === 0
                ? "Create your first job listing to start receiving applications."
                : "Try changing your search or status filter."}
            </p>

            {jobs.length === 0 ? (
              <Link
                to="/employer/jobs/new"
                className="nx-button nx-button-primary mt-6 inline-flex items-center gap-2"
              >
                <Plus size={17} />
                Post your first job
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("all");
                }}
                className="mt-5 text-sm font-bold text-wine hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : null}
      </section>

      {/* Delete confirmation dialog */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setSelectedJob(null);
            }
          }}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-panel border border-border bg-sand-light p-6 shadow-premium"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-job-title"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
                <Trash2 size={22} />
              </div>

              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                disabled={!!deletingId}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-muted transition hover:bg-sand disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <h2
              id="delete-job-title"
              className="mt-5 font-heading text-xl font-extrabold text-ink"
            >
              Delete this job listing?
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              You're about to delete{" "}
              <strong className="text-ink">{selectedJob.title}</strong>.
              Make sure you understand how your backend handles existing
              applications before proceeding.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                disabled={!!deletingId}
                className="rounded-control border border-border px-4 py-2.5 text-sm font-bold text-muted transition hover:bg-sand disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={remove}
                disabled={!!deletingId}
                className="inline-flex items-center justify-center gap-2 rounded-control bg-danger px-4 py-2.5 text-sm font-bold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} />
                {deletingId ? "Deleting..." : "Delete listing"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function UsersIcon() {
  return <Users2 size={14} />;
}
