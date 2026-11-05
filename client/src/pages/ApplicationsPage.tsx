
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  BriefcaseBusiness,
  Clock3,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MapPin,
  CalendarDays,
  RefreshCw,
  ArrowUpRight,
  Inbox,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

import { applicationApi } from "../api/services";
import { getApiError } from "../api/client";
import type { Application } from "../types";

type Filter = "all" | "pending" | "reviewed" | "accepted" | "rejected";

const filters: { label: string; value: Filter }[] = [
  { label: "All applications", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

function normalizeStatus(status?: string) {
  return (status || "pending").toLowerCase().trim();
}

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

function StatusBadge({ status }: { status?: string }) {
  const value = normalizeStatus(status);

  const styles: Record<string, string> = {
    pending: "bg-warning-soft text-warning",
    reviewed: "bg-info-soft text-info",
    accepted: "bg-success-soft text-success",
    rejected: "bg-danger-soft text-danger",
  };

  const icons: Record<string, typeof Clock3> = {
    pending: Clock3,
    reviewed: FileText,
    accepted: CheckCircle2,
    rejected: XCircle,
  };

  const Icon = icons[value] || Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
        styles[value] || "bg-sand text-muted"
      }`}
    >
      <Icon size={13} />
      {value.replaceAll("_", " ")}
    </span>
  );
}

function ApplicationSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
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
  );
}

export default function ApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const reduceMotion = useReducedMotion();

  const fetchApplications = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const response = await applicationApi.mine();
      setItems(response.data.applications || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await applicationApi.mine();

        if (active) {
          setItems(response.data.applications || []);
          setError("");
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
  }, []);

  const stats = useMemo(() => {
    const count = (status: string) =>
      items.filter((item) => normalizeStatus(item.status) === status).length;

    return {
      total: items.length,
      pending: count("pending"),
      reviewed: count("reviewed"),
      accepted: count("accepted"),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();

    return items.filter((item) => {
      const job = typeof item.job === "object" ? item.job : null;
      const status = normalizeStatus(item.status);

      const matchesFilter =
        activeFilter === "all" || status === activeFilter;

      const matchesSearch =
        !query ||
        job?.title?.toLowerCase().includes(query) ||
        job?.company?.toLowerCase().includes(query) ||
        job?.location?.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [items, search, activeFilter]);

  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.07,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* Header */}
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
              Your job search
            </span>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              My applications<span className="text-sand">.</span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-6 text-sand/75 sm:text-base">
              Every opportunity starts somewhere. Keep track of the roles
              you've applied for and monitor your progress.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex w-fit items-center gap-2 rounded-control bg-sand px-5 py-3 text-sm font-bold text-wine transition hover:bg-sand-light"
          >
            Explore opportunities
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          {
            label: "Total applications",
            value: stats.total,
            icon: BriefcaseBusiness,
            color: "bg-wine-soft text-wine",
          },
          {
            label: "Awaiting response",
            value: stats.pending,
            icon: Clock3,
            color: "bg-warning-soft text-warning",
          },
          {
            label: "Reviewed",
            value: stats.reviewed,
            icon: FileText,
            color: "bg-info-soft text-info",
          },
          {
            label: "Accepted",
            value: stats.accepted,
            icon: CheckCircle2,
            color: "bg-success-soft text-success",
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="rounded-card border border-border bg-sand-light p-4 shadow-soft sm:p-5"
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

              <p className="mt-1 text-xs font-medium text-muted sm:text-sm">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Applications */}
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-wine">
              Application tracker
            </span>
            <h2 className="mt-1 font-heading text-2xl font-extrabold text-ink">
              Your opportunities
            </h2>
            <p className="mt-1 text-sm text-muted">
              Review your application history and current status.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchApplications}
            disabled={busy}
            className="inline-flex w-fit items-center gap-2 rounded-control border border-border bg-sand-light px-4 py-2.5 text-sm font-bold text-ink transition hover:border-wine/30 hover:text-wine disabled:opacity-50"
          >
            <RefreshCw size={15} className={busy ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by job title, company or location..."
              className="nx-input w-full pl-11"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
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
              {filter.value === "all" && (
                <span className="ml-2 opacity-70">{items.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex flex-col gap-3 rounded-card border border-danger/20 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-danger">
                Couldn't load your applications
              </p>
              <p className="mt-1 text-sm text-danger/80">{error}</p>
            </div>

            <button
              type="button"
              onClick={fetchApplications}
              className="rounded-control bg-danger px-4 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {busy ? (
          <ApplicationSkeleton />
        ) : !error && filteredItems.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredItems.map((application) => {
              const job =
                typeof application.job === "object"
                  ? application.job
                  : null;

              return (
                <motion.article
                  key={application._id}
                  variants={itemVariants}
                  className="group rounded-card border border-border bg-sand-light p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-wine/20 hover:shadow-card sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-wine-soft text-wine">
                        <BriefcaseBusiness size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-heading text-base font-extrabold text-ink sm:text-lg">
                          {job?.title || "Job unavailable"}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-wine">
                          {job?.company || "Company unavailable"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={14} />
                            {job?.location || "Location not specified"}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            Applied {formatDate(application.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4 lg:border-0 lg:pt-0">
                      <StatusBadge status={application.status} />

                      {application.resume && (
                        <a
                          href={application.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 text-xs font-bold text-muted transition hover:border-wine/30 hover:text-wine"
                        >
                          <FileText size={14} />
                          Resume
                          <ExternalLink size={12} />
                        </a>
                      )}

                      {job && "_id" in job && (
                        <Link
                          to={`/jobs/${job._id}`}
                          className="inline-flex items-center gap-1.5 rounded-control bg-wine px-3 py-2 text-xs font-bold text-sand-light transition hover:bg-wine-dark"
                        >
                          View job
                          <ArrowUpRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        ) : !error ? (
          <div className="rounded-panel border border-dashed border-border bg-sand-light px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-soft text-wine">
              {items.length === 0 ? (
                <Inbox size={28} />
              ) : (
                <Search size={28} />
              )}
            </div>

            <h3 className="mt-5 font-heading text-xl font-extrabold text-ink">
              {items.length === 0
                ? "No applications yet"
                : "No matching applications"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              {items.length === 0
                ? "Your application activity will appear here once you apply for a job."
                : "Try changing your search term or selecting a different status filter."}
            </p>

            {items.length === 0 ? (
              <Link
                to="/jobs"
                className="nx-button nx-button-primary mt-6 inline-flex items-center gap-2"
              >
                Explore jobs
                <ArrowUpRight size={16} />
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
    </div>
  );
}
