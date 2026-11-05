
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  Users,
  Search,
  MapPin,
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  AlertCircle,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";

import { applicationApi, jobApi } from "../api/services";
import { getApiError } from "../api/client";
import type {
  Application,
  ApplicationStatus,
  Job,
  User,
} from "../types";

type Filter =
  | "all"
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "accepted"
  | "rejected";

const statusOptions: ApplicationStatus[] = [
  "pending",
  "reviewing",
  "shortlisted",
  "rejected",
  "accepted",
];

const filters: { label: string; value: Filter }[] = [
  { label: "All candidates", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Reviewing", value: "reviewing" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

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

function getInitials(name?: string) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-warning-soft text-warning",
    reviewing: "bg-info-soft text-info",
    shortlisted: "bg-wine-soft text-wine",
    accepted: "bg-success-soft text-success",
    rejected: "bg-danger-soft text-danger",
  };

  const icons: Record<string, typeof Clock3> = {
    pending: Clock3,
    reviewing: FileText,
    shortlisted: CheckCircle2,
    accepted: CheckCircle2,
    rejected: XCircle,
  };

  const Icon = icons[status] || Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
        styles[status] || "bg-sand text-muted"
      }`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}

function ApplicantSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex flex-col gap-4 rounded-card border border-border bg-sand-light p-5 sm:flex-row sm:items-center"
        >
          <div className="h-14 w-14 rounded-2xl bg-sand" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-sand" />
            <div className="h-3 w-52 rounded bg-sand" />
            <div className="h-3 w-28 rounded bg-sand" />
          </div>
          <div className="h-9 w-32 rounded-control bg-sand" />
        </div>
      ))}
    </div>
  );
}

export default function ApplicantsPage() {
  const { jobId = "" } = useParams();
  const reduceMotion = useReducedMotion();

  const [job, setJob] = useState<Job | null>(null);
  const [items, setItems] = useState<Application[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  const fetchApplicants = useCallback(async () => {
    if (!jobId) {
      setError("Missing job ID.");
      setBusy(false);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const [jobResponse, applicationResponse] = await Promise.all([
        jobApi.mine(),
        applicationApi.forJob(jobId),
      ]);

      const currentJob =
        jobResponse.data.jobs.find((item) => item._id === jobId) || null;

      setJob(currentJob);
      setItems(applicationResponse.data.applications || []);

      if (!currentJob) {
        setError("This job listing could not be found in your account.");
      }
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
    }
  }, [jobId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setBusy(true);
      setError("");

      try {
        if (!jobId) throw new Error("Missing job ID.");

        const [jobResponse, applicationResponse] = await Promise.all([
          jobApi.mine(),
          applicationApi.forJob(jobId),
        ]);

        if (!active) return;

        const currentJob =
          jobResponse.data.jobs.find((item) => item._id === jobId) || null;

        setJob(currentJob);
        setItems(applicationResponse.data.applications || []);

        if (!currentJob) {
          setError("This job listing could not be found in your account.");
        }
      } catch (err) {
        if (active) setError(getApiError(err));
      } finally {
        if (active) setBusy(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [jobId]);

  const counts = useMemo(() => {
    const count = (status: string) =>
      items.filter((item) => item.status === status).length;

    return {
      total: items.length,
      pending: count("pending"),
      reviewing: count("reviewing"),
      shortlisted: count("shortlisted"),
      accepted: count("accepted"),
      rejected: count("rejected"),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((application) => {
      const person =
        typeof application.applicant === "object"
          ? (application.applicant as User)
          : null;

      const matchesFilter =
        activeFilter === "all" || application.status === activeFilter;

      const matchesSearch =
        !query ||
        person?.name?.toLowerCase().includes(query) ||
        person?.email?.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [items, search, activeFilter]);

  const changeStatus = async (
    id: string,
    status: ApplicationStatus
  ) => {
    const currentApplication = items.find((item) => item._id === id);

    if (!currentApplication || currentApplication.status === status) return;

    if (updatingIds.includes(id)) return;

    const previousStatus = currentApplication.status;

    setUpdatingIds((prev) => [...prev, id]);

    // Optimistic update: revert if the API request fails.
    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, status } : item
      )
    );

    try {
      await applicationApi.updateStatus(id, status);
      toast.success("Application status updated");
    } catch (err) {
      setItems((prev) =>
        prev.map((item) =>
          item._id === id
            ? { ...item, status: previousStatus }
            : item
        )
      );

      toast.error(getApiError(err));
    } finally {
      setUpdatingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* Back navigation */}
      <Link
        to="/employer/jobs"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-wine"
      >
        <ArrowLeft size={17} />
        Back to job listings
      </Link>

      {/* Header */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-panel bg-wine px-6 py-8 text-sand-light shadow-wine sm:px-9 sm:py-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-sand/10" />
        <div className="pointer-events-none absolute -right-5 -top-12 h-52 w-52 rounded-full border border-sand/10" />

        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-sand/20 bg-sand/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-sand">
              <Users size={13} />
              Candidate pipeline
            </span>

            <h1 className="max-w-2xl break-words font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              {job?.title || "Job applicants"}
              <span className="text-sand">.</span>
            </h1>

            <p className="mt-3 text-sm text-sand/75 sm:text-base">
              {job?.company || "Review and manage your candidates"}
              {job?.location ? ` · ${job.location}` : ""}
            </p>
          </div>

          <div className="shrink-0 rounded-card border border-sand/15 bg-sand/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand/70">
              Total applicants
            </p>
            <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums">
              {busy ? "—" : counts.total}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Error state */}
      {error && (
        <div className="flex flex-col gap-3 rounded-card border border-danger/20 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger" />
            <div>
              <p className="font-bold text-danger">
                Couldn't load candidate information
              </p>
              <p className="mt-1 text-sm text-danger/80">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchApplicants}
            disabled={busy}
            className="rounded-control bg-danger px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          {
            label: "Pending",
            value: counts.pending,
            icon: Clock3,
            color: "bg-warning-soft text-warning",
          },
          {
            label: "Reviewing",
            value: counts.reviewing,
            icon: FileText,
            color: "bg-info-soft text-info",
          },
          {
            label: "Shortlisted",
            value: counts.shortlisted,
            icon: CheckCircle2,
            color: "bg-wine-soft text-wine",
          },
          {
            label: "Accepted",
            value: counts.accepted,
            icon: CheckCircle2,
            color: "bg-success-soft text-success",
          },
          {
            label: "Rejected",
            value: counts.rejected,
            icon: XCircle,
            color: "bg-danger-soft text-danger",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.05 }}
              className="rounded-card border border-border bg-sand-light p-4 shadow-soft"
            >
              <span className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
                <Icon size={18} />
              </span>

              <p className="mt-4 font-heading text-2xl font-extrabold tabular-nums text-ink">
                {busy ? "—" : stat.value}
              </p>

              <p className="mt-1 text-xs font-semibold text-muted">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </section>

      {/* Candidate list */}
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-wine">
              Recruitment management
            </span>
            <h2 className="mt-1 font-heading text-2xl font-extrabold text-ink">
              Candidates
            </h2>
            <p className="mt-1 text-sm text-muted">
              Review candidate profiles and update their application status.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchApplicants}
            disabled={busy}
            className="inline-flex w-fit items-center gap-2 rounded-control border border-border bg-sand-light px-4 py-2.5 text-sm font-bold text-muted transition hover:border-wine/30 hover:text-wine disabled:opacity-50"
          >
            <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidates by name or email..."
            className="nx-input w-full pl-11"
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const count =
              filter.value === "all"
                ? counts.total
                : counts[filter.value];

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
                  activeFilter === filter.value
                    ? "bg-wine text-sand-light shadow-wine"
                    : "border border-border bg-sand-light text-muted hover:border-wine/30 hover:text-wine"
                }`}
              >
                {filter.label}
                <span className="ml-2 opacity-70">{busy ? "—" : count}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {busy ? (
          <ApplicantSkeleton />
        ) : !error && filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((application, index) => {
              const person =
                typeof application.applicant === "object"
                  ? (application.applicant as User)
                  : null;

              const isUpdating = updatingIds.includes(application._id);

              return (
                <motion.article
                  key={application._id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.035 }}
                  className="rounded-card border border-border bg-sand-light p-5 shadow-soft transition duration-300 hover:border-wine/20 hover:shadow-card sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    {/* Candidate information */}
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-wine text-lg font-extrabold text-sand">
                        {getInitials(person?.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-base font-extrabold text-ink sm:text-lg">
                            {person?.name || "Candidate"}
                          </h3>
                          <StatusBadge status={application.status} />
                        </div>

                        <p className="mt-1 break-all text-sm text-muted">
                          {person?.email || "Email unavailable"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            Applied {formatDate(application.createdAt)}
                          </span>

                          {person?.role && (
                            <span className="inline-flex items-center gap-1.5 capitalize">
                              <UserRound size={14} />
                              {person.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end lg:border-0 lg:pt-0">
                      {application.resume ? (
                        <a
                          href={application.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-control border border-border px-4 py-2.5 text-xs font-bold text-muted transition hover:border-wine/30 hover:text-wine"
                        >
                          <Download size={15} />
                          View resume
                          <ArrowUpRight size={13} />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-control bg-sand px-4 py-2.5 text-xs font-semibold text-subtle">
                          <FileText size={15} />
                          No resume
                        </span>
                      )}

                      <label className="min-w-40">
                        <span className="mb-1.5 block text-xs font-bold text-muted">
                          Update status
                        </span>

                        <select
                          value={application.status}
                          disabled={isUpdating}
                          onChange={(event) =>
                            changeStatus(
                              application._id,
                              event.target.value as ApplicationStatus
                            )
                          }
                          className="nx-input w-full text-sm capitalize disabled:cursor-wait disabled:opacity-60"
                        >
                          {statusOptions.map((status) => (
                            <option
                              key={status}
                              value={status}
                              className="capitalize"
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  {isUpdating && (
                    <p className="mt-3 text-xs font-medium text-muted">
                      Updating application status...
                    </p>
                  )}
                </motion.article>
              );
            })}
          </div>
        ) : !error ? (
          <div className="rounded-panel border border-dashed border-border bg-sand-light px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-soft text-wine">
              {items.length === 0 ? (
                <Users size={28} />
              ) : (
                <Search size={28} />
              )}
            </div>

            <h3 className="mt-5 font-heading text-xl font-extrabold text-ink">
              {items.length === 0
                ? "No applications yet"
                : "No matching candidates"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              {items.length === 0
                ? "New candidate applications for this role will appear here."
                : "Try another search term or select a different application status."}
            </p>

            {items.length > 0 && (
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
    </div>
  );
}
