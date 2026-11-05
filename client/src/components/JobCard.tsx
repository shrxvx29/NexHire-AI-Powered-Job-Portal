
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  MapPin,
  Clock3,
  BriefcaseBusiness,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { Job } from "../types";

type JobCardProps = {
  job: Job;
};

export default function JobCard({ job }: JobCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const company = job.company?.trim() || "Company";
  const title = job.title?.trim() || "Untitled position";
  const description =
    job.description?.trim() || "No job description available.";

  const skills = Array.isArray(job.skills)
    ? job.skills.filter((skill) => typeof skill === "string" && skill.trim())
    : [];

  const companyInitial = company.charAt(0).toUpperCase();

  return (
    <motion.article
      initial={
        shouldReduceMotion ? false : { opacity: 0, y: 16 }
      }
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        shouldReduceMotion ? undefined : { y: -3 }
      }
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative overflow-hidden rounded-card border border-border bg-sand-light p-5 shadow-soft transition-all duration-300 hover:border-wine/20 hover:shadow-card sm:p-6"
    >
      {/* Subtle decorative accent */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-wine-soft/30 transition-transform duration-500 group-hover:scale-125"
      />

      <div className="relative z-10">

        {/* TOP: Company and job title */}

        <div className="flex items-start gap-4">

          {/* Company logo placeholder */}

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-wine/10 bg-wine-soft font-heading text-xl font-extrabold text-wine transition-colors duration-300 group-hover:bg-wine group-hover:text-sand">
            {companyInitial}
          </div>

          {/* Job information */}

          <div className="min-w-0 flex-1">
            <h3 className="break-words font-heading text-base font-extrabold leading-snug text-ink transition-colors group-hover:text-wine sm:text-lg">
              {title}
            </h3>

            <p className="mt-1 truncate text-xs font-semibold text-muted">
              {company}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-wine/10 bg-wine-soft px-2.5 py-1 text-[9px] font-bold text-wine">
                <BriefcaseBusiness size={11} />
                {job.jobType || "Job type unavailable"}
              </span>
            </div>
          </div>

          {/* View job */}

          <Link
            to={`/jobs/${job._id}`}
            aria-label={`View ${title} at ${company}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-sand-light text-muted transition-all duration-300 hover:border-wine hover:bg-wine hover:text-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
          >
            <ArrowUpRight
              size={19}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>


        {/* DIVIDER */}

        <div className="my-5 h-px bg-border/80" />


        {/* JOB DETAILS */}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <MapPin size={14} className="shrink-0 text-wine" />
            <span>{job.location || "Location not specified"}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock3 size={14} className="shrink-0 text-wine" />
            <span>
              {job.experienceLevel || "Experience not specified"}
            </span>
          </div>
        </div>


        {/* DESCRIPTION */}

        <p className="mt-4 line-clamp-2 text-xs leading-6 text-muted">
          {description}
        </p>


        {/* SKILLS */}

        <div className="mt-5">
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-border bg-sand px-3 py-1.5 text-[10px] font-semibold text-ink transition-colors hover:border-wine/30 hover:bg-wine-soft hover:text-wine"
                >
                  {skill}
                </span>
              ))}

              {skills.length > 4 && (
                <span className="rounded-lg border border-border bg-sand px-3 py-1.5 text-[10px] font-semibold text-muted">
                  +{skills.length - 4} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] italic text-subtle">
              Skills not specified
            </span>
          )}
        </div>


        {/* BOTTOM: Salary and action */}

        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <span className="text-[9px] font-bold tracking-[1.5px] text-subtle">
              COMPENSATION
            </span>

            <p className="mt-1 break-words font-heading text-sm font-extrabold text-wine-dark">
              {job.salary || "Salary not disclosed"}
            </p>
          </div>

          <Link
            to={`/jobs/${job._id}`}
            className="nx-button nx-button-primary w-full shrink-0 sm:w-auto"
          >
            View details
            <ArrowRightIcon />
          </Link>
        </div>

      </div>
    </motion.article>
  );
}

function ArrowRightIcon() {
  return <ArrowUpRight size={15} />;
}
