
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Filter,
  RotateCcw,
  MapPinned,
  Layers3,
} from "lucide-react";

import { jobApi } from "../api/services";
import { getApiError } from "../api/client";

import type { Job } from "../types";
import JobCard from "../components/JobCard";

const PAGE_SIZE = 8;
const MAX_VISIBLE_PAGES = 5;

const JOB_TYPES = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Contract",
];

const EXPERIENCE_LEVELS = [
  "Fresher",
  "Entry-level",
  "Mid-level",
  "Senior",
];

type SearchFilters = {
  search: string;
  location: string;
};

type ActiveFilter = {
  id: string;
  label: string;
  value: string;
  remove: () => void;
};

function JobsSkeleton() {
  return (
    <div
      className="space-y-4"
      aria-label="Loading jobs"
      aria-live="polite"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-card border border-border bg-sand-light p-5 sm:p-6"
        >
          <div className="flex gap-4">
            <div className="nx-skeleton h-12 w-12 shrink-0 rounded-xl" />

            <div className="min-w-0 flex-1 space-y-3">
              <div className="nx-skeleton h-4 w-2/3 rounded" />
              <div className="nx-skeleton h-3 w-1/3 rounded" />
              <div className="nx-skeleton h-3 w-full rounded" />
              <div className="nx-skeleton h-3 w-4/5 rounded" />

              <div className="flex flex-wrap gap-2 pt-2">
                <div className="nx-skeleton h-6 w-20 rounded-full" />
                <div className="nx-skeleton h-6 w-20 rounded-full" />
                <div className="nx-skeleton h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyJobs({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-border bg-sand-light px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-soft text-wine">
        <Search size={28} />
      </div>

      <h3 className="mt-5 font-heading text-xl font-extrabold text-ink">
        {hasFilters
          ? "No matching opportunities"
          : "No opportunities available"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        {hasFilters
          ? "We couldn't find jobs matching your current filters. Try changing your search or removing some filters."
          : "There are currently no job listings available. Please check again later."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="nx-button nx-button-primary mt-6"
        >
          <RotateCcw size={16} />
          Clear all filters
        </button>
      )}
    </div>
  );
}

function Pagination({
  page,
  pages,
  busy,
  onPageChange,
}: {
  page: number;
  pages: number;
  busy: boolean;
  onPageChange: (page: number) => void;
}) {
  const visiblePages = useMemo(() => {
    const count = Math.min(MAX_VISIBLE_PAGES, pages);

    let start = Math.max(
      1,
      page - Math.floor(count / 2)
    );

    let end = Math.min(pages, start + count - 1);

    start = Math.max(1, end - count + 1);

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }, [page, pages]);

  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Job results pagination"
      className="flex flex-col gap-4 rounded-card border border-border bg-sand-light p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <p className="text-xs font-medium text-muted">
        Page{" "}
        <span className="font-extrabold text-ink">
          {page}
        </span>{" "}
        of{" "}
        <span className="font-extrabold text-ink">
          {pages}
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || busy}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="inline-flex min-h-10 items-center gap-1 rounded-control border border-border px-3 text-xs font-bold text-ink transition hover:border-wine hover:text-wine disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            disabled={busy}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={
              pageNumber === page ? "page" : undefined
            }
            onClick={() => onPageChange(pageNumber)}
            className={`flex h-10 min-w-10 items-center justify-center rounded-control px-3 text-xs font-bold transition ${
              pageNumber === page
                ? "bg-wine text-sand-light shadow-wine"
                : "border border-border bg-white text-muted hover:border-wine hover:text-wine"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= pages || busy}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="inline-flex min-h-10 items-center gap-1 rounded-control bg-wine px-3 text-xs font-bold text-sand-light transition hover:bg-wine-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}

export default function JobsPage() {
  // Search input values
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  // Applied search filters
  const [appliedFilters, setAppliedFilters] =
    useState<SearchFilters>({
      search: "",
      location: "",
    });

  // Additional filters
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState("");

  // Mobile filter visibility
  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // API state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  // Explicit refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Prevent outdated requests from overwriting newer results.
  const requestIdRef = useRef(0);

  // Load jobs
  useEffect(() => {
    let cancelled = false;

    const requestId = ++requestIdRef.current;

    const loadJobs = async () => {
      setBusy(true);
      setError("");

      try {
        const { data } = await jobApi.list({
          search: appliedFilters.search,
          location: appliedFilters.location,
          jobType,
          experienceLevel,
          page,
          limit: PAGE_SIZE,
        });

        if (
          cancelled ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const nextPages = Math.max(
          1,
          data.totalPages ?? 1
        );

        setJobs(data.jobs ?? []);
        setPages(nextPages);
        setTotal(data.totalJobs ?? 0);

        // Protect against a page that no longer exists
        // after jobs are deleted or filters are changed.
        if (page > nextPages) {
          setPage(nextPages);
        }
      } catch (err) {
        if (
          cancelled ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setJobs([]);
        setPages(1);
        setTotal(0);
        setError(getApiError(err));
      } finally {
        if (
          !cancelled &&
          requestId === requestIdRef.current
        ) {
          setBusy(false);
        }
      }
    };

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, [
    appliedFilters,
    jobType,
    experienceLevel,
    page,
    refreshKey,
  ]);

  // Search submit
  const handleSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPage(1);

    setAppliedFilters({
      search: search.trim(),
      location: location.trim(),
    });
  };

  // Clear everything
  const handleClear = useCallback(() => {
    setSearch("");
    setLocation("");

    setAppliedFilters({
      search: "",
      location: "",
    });

    setJobType("");
    setExperienceLevel("");
    setPage(1);
    setMobileFiltersOpen(false);

    setRefreshKey((previous) => previous + 1);
  }, []);

  // Remove individual filters
  const removeSearchFilter = () => {
    setSearch("");
    setAppliedFilters((previous) => ({
      ...previous,
      search: "",
    }));
    setPage(1);
  };

  const removeLocationFilter = () => {
    setLocation("");
    setAppliedFilters((previous) => ({
      ...previous,
      location: "",
    }));
    setPage(1);
  };

  const removeJobTypeFilter = () => {
    setJobType("");
    setPage(1);
  };

  const removeExperienceFilter = () => {
    setExperienceLevel("");
    setPage(1);
  };

  const handleRetry = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const handlePageChange = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > pages ||
      nextPage === page
    ) {
      return;
    }

    setPage(nextPage);

    // Move the user back to the results section.
    document
      .getElementById("job-results")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const activeFilters: ActiveFilter[] = [];

  if (appliedFilters.search) {
    activeFilters.push({
      id: "search",
      label: "Keyword",
      value: appliedFilters.search,
      remove: removeSearchFilter,
    });
  }

  if (appliedFilters.location) {
    activeFilters.push({
      id: "location",
      label: "Location",
      value: appliedFilters.location,
      remove: removeLocationFilter,
    });
  }

  if (jobType) {
    activeFilters.push({
      id: "jobType",
      label: "Job type",
      value: jobType,
      remove: removeJobTypeFilter,
    });
  }

  if (experienceLevel) {
    activeFilters.push({
      id: "experience",
      label: "Experience",
      value: experienceLevel,
      remove: removeExperienceFilter,
    });
  }

  const hasActiveFilters = activeFilters.length > 0;

  const resultStart =
    total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const resultEnd = Math.min(
    page * PAGE_SIZE,
    total
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-7 pb-10 sm:space-y-8">

      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-wine" />

            <span className="text-[10px] font-extrabold tracking-[2px] text-wine">
              DISCOVER OPPORTUNITIES
            </span>
          </div>

          <h1 className="font-heading text-3xl font-extrabold tracking-[-1px] text-ink sm:text-4xl">
            Find your next role.
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            Explore opportunities that match your skills,
            experience and career ambitions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start rounded-control border border-border bg-sand-light px-4 py-3 sm:self-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
            <BriefcaseBusiness size={19} />
          </div>

          <div>
            <p className="text-lg font-extrabold tabular-nums text-ink">
              {busy ? "—" : total.toLocaleString("en-IN")}
            </p>

            <p className="text-[10px] font-semibold text-muted">
              Available opportunities
            </p>
          </div>
        </div>
      </section>

      {/* SEARCH PANEL */}
      <section className="rounded-panel border border-border bg-sand-light p-4 shadow-soft sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-soft text-wine">
            <Search size={18} />
          </div>

          <div>
            <h2 className="text-sm font-extrabold text-ink">
              Search opportunities
            </h2>

            <p className="text-[11px] text-muted">
              Search by role, company or location.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="grid gap-3 lg:grid-cols-[1fr_0.8fr_auto]"
        >
          {/* KEYWORD */}
          <label className="flex min-h-12 items-center gap-3 rounded-control border border-border bg-white px-4 transition focus-within:border-wine focus-within:ring-4 focus-within:ring-wine/5">
            <Search
              size={18}
              className="shrink-0 text-muted"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Job title, company or keyword"
              aria-label="Search job title, company or keyword"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear keyword"
                className="shrink-0 rounded-full p-1 text-muted transition hover:bg-sand hover:text-wine"
              >
                <X size={15} />
              </button>
            )}
          </label>

          {/* LOCATION */}
          <label className="flex min-h-12 items-center gap-3 rounded-control border border-border bg-white px-4 transition focus-within:border-wine focus-within:ring-4 focus-within:ring-wine/5">
            <MapPin
              size={18}
              className="shrink-0 text-muted"
            />

            <input
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="City or location"
              aria-label="Job location"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
            />

            {location && (
              <button
                type="button"
                onClick={() => setLocation("")}
                aria-label="Clear location"
                className="shrink-0 rounded-full p-1 text-muted transition hover:bg-sand hover:text-wine"
              >
                <X size={15} />
              </button>
            )}
          </label>

          {/* SEARCH BUTTON */}
          <button
            type="submit"
            disabled={busy}
            className="nx-button nx-button-primary min-h-12 px-6 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search size={16} />
            Search jobs
          </button>
        </form>

        <p className="mt-3 text-[10px] text-muted">
          Tip: Try keywords like React Developer, Node.js or Full Stack.
        </p>
      </section>

      {/* FILTER SECTION */}
      <section className="space-y-4">

        {/* FILTER TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wine-soft text-wine">
              <SlidersHorizontal size={17} />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-ink">
                Refine your search
              </h2>

              <p className="text-[10px] text-muted">
                Narrow down opportunities
              </p>
            </div>
          </div>

          {/* MOBILE FILTER BUTTON */}
          <button
            type="button"
            onClick={() =>
              setMobileFiltersOpen((previous) => !previous)
            }
            aria-expanded={mobileFiltersOpen}
            aria-controls="job-filter-controls"
            className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-sand-light px-4 text-xs font-bold text-ink transition hover:border-wine hover:text-wine sm:hidden"
          >
            <Filter size={15} />
            Filters

            {activeFilters.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-wine px-1.5 text-[10px] text-white">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* FILTER CONTROLS */}
        <div
          id="job-filter-controls"
          className={`${
            mobileFiltersOpen ? "grid" : "hidden"
          } grid-cols-1 gap-3 sm:grid sm:grid-cols-2 lg:flex lg:flex-wrap`}
        >
          <label className="relative min-w-0 lg:min-w-[190px]">
            <span className="sr-only">Filter by job type</span>

            <select
              value={jobType}
              onChange={(event) => {
                setJobType(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by job type"
              className="min-h-11 w-full appearance-none rounded-control border border-border bg-sand-light px-4 pr-9 text-xs font-semibold text-ink outline-none transition hover:border-wine focus:border-wine focus:ring-4 focus:ring-wine/5"
            >
              <option value="">All job types</option>

              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <ChevronRight
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted"
            />
          </label>

          <label className="relative min-w-0 lg:min-w-[210px]">
            <span className="sr-only">
              Filter by experience level
            </span>

            <select
              value={experienceLevel}
              onChange={(event) => {
                setExperienceLevel(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by experience level"
              className="min-h-11 w-full appearance-none rounded-control border border-border bg-sand-light px-4 pr-9 text-xs font-semibold text-ink outline-none transition hover:border-wine focus:border-wine focus:ring-4 focus:ring-wine/5"
            >
              <option value="">
                All experience levels
              </option>

              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <ChevronRight
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted"
            />
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-xs font-bold text-wine transition hover:bg-wine-soft"
            >
              <RotateCcw size={14} />
              Clear all
            </button>
          )}
        </div>

        {/* ACTIVE FILTER CHIPS */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              Active:
            </span>

            {activeFilters.map((filter) => (
              <span
                key={filter.id}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-wine/15 bg-wine-soft px-3 py-1.5 text-[10px] font-bold text-wine"
              >
                <span className="shrink-0 text-wine/70">
                  {filter.label}:
                </span>

                <span className="max-w-[150px] truncate">
                  {filter.value}
                </span>

                <button
                  type="button"
                  onClick={filter.remove}
                  aria-label={`Remove ${filter.label} filter`}
                  className="rounded-full p-0.5 transition hover:bg-wine/10"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* RESULTS */}
      <section
        id="job-results"
        className="scroll-mt-24 space-y-5"
        aria-busy={busy}
      >
        {/* RESULTS HEADER */}
        <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-[9px] font-extrabold tracking-[2px] text-wine">
              CAREER OPPORTUNITIES
            </span>

            <h2 className="mt-1 font-heading text-xl font-extrabold text-ink">
              {hasActiveFilters
                ? "Matching jobs"
                : "Latest opportunities"}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
            <Layers3 size={14} className="text-wine" />

            {busy
              ? "Updating results..."
              : total > 0
                ? `Showing ${resultStart}–${resultEnd} of ${total} jobs`
                : "No jobs found"}
          </div>
        </div>

        {/* ERROR STATE */}
        {error && !busy && (
          <div
            role="alert"
            className="flex flex-col gap-4 rounded-card border border-danger/20 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-danger"
              />

              <div>
                <p className="text-sm font-bold text-danger">
                  Unable to load opportunities
                </p>

                <p className="mt-1 text-xs leading-5 text-danger/80">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-control border border-danger/20 px-4 text-xs font-bold text-danger transition hover:bg-danger/10"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        {/* LOADING */}
        {busy && <JobsSkeleton />}

        {/* SUCCESS */}
        {!busy && !error && jobs.length > 0 && (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                />
              ))}
            </div>

            <Pagination
              page={page}
              pages={pages}
              busy={busy}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* EMPTY */}
        {!busy && !error && jobs.length === 0 && (
          <EmptyJobs
            hasFilters={hasActiveFilters}
            onClear={handleClear}
          />
        )}
      </section>

      {/* BOTTOM DISCOVERY NOTE */}
      {!busy && !error && jobs.length > 0 && (
        <div className="flex items-start gap-3 rounded-card border border-border bg-sand-light/70 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wine-soft text-wine">
            <Sparkles size={17} />
          </div>

          <div>
            <p className="text-xs font-bold text-ink">
              Keep exploring
            </p>

            <p className="mt-1 text-[11px] leading-5 text-muted">
              Use keywords, locations and experience filters to discover opportunities that better match your career goals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
