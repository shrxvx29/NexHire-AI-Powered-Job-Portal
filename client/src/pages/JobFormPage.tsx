
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";

import { jobApi } from "../api/services";
import { getApiError } from "../api/client";
import type { ExperienceLevel, JobType } from "../types";

const initial = {
  title: "",
  company: "",
  location: "",
  description: "",
  salary: "",
  jobType: "Full-Time" as JobType,
  experienceLevel: "Fresher" as ExperienceLevel,
  skills: "",
};

const jobTypes: JobType[] = [
  "Full-Time",
  "Part-Time",
  "Internship",
  "Contract",
];

const experienceLevels: ExperienceLevel[] = [
  "Fresher",
  "Entry-level",
  "Mid-level",
  "Senior",
];

type FormState = typeof initial;

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-2 block text-sm font-bold text-ink">
      {children}
      {required && <span className="ml-1 text-danger">*</span>}
    </span>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="nx-input w-full"
      />
    </label>
  );
}

export default function JobFormPage() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const [loadingJob, setLoadingJob] = useState(edit);
  const [loadError, setLoadError] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  const update = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const skills = useMemo(
    () =>
      [...new Set(
        form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      )],
    [form.skills]
  );

  const fetchJob = useCallback(async () => {
    if (!id) return;

    setLoadingJob(true);
    setLoadError("");

    try {
      const response = await jobApi.mine();
      const job = response.data.jobs.find((item) => item._id === id);

      if (!job) {
        setLoadError("This job listing could not be found in your account.");
        return;
      }

      setForm({
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        description: job.description || "",
        salary: job.salary || "",
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        skills: (job.skills || []).join(", "),
      });
    } catch (error) {
      setLoadError(getApiError(error));
    } finally {
      setLoadingJob(false);
    }
  }, [id]);

  useEffect(() => {
    if (edit) {
      fetchJob();
    }
  }, [edit, fetchJob]);

  const addSkill = () => {
    const value = skillsInput.trim();

    if (!value) return;

    if (skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      toast.error("This skill is already added");
      return;
    }

    update("skills", [...skills, value].join(", "));
    setSkillsInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    update(
      "skills",
      skills.filter((skill) => skill !== skillToRemove).join(", ")
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (edit && loadError) {
      toast.error("Unable to edit this job. Reload the listing first.");
      return;
    }

    const title = form.title.trim();
    const company = form.company.trim();
    const location = form.location.trim();
    const description = form.description.trim();

    if (!title || !company || !location || !description) {
      toast.error("Please complete all required fields");
      return;
    }

    if (title.length < 3) {
      toast.error("Job title must contain at least 3 characters");
      return;
    }

    if (description.length < 30) {
      toast.error("Please provide a more detailed job description");
      return;
    }

    const payload = {
      ...form,
      title,
      company,
      location,
      description,
      salary: form.salary.trim(),
      skills,
    };

    setBusy(true);

    try {
      if (id) {
        await jobApi.update(id, payload);
        toast.success("Job listing updated successfully");
      } else {
        await jobApi.create(payload);
        toast.success("Job published successfully");
      }

      navigate("/employer/jobs");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setBusy(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 pb-12">
        <div className="h-5 w-32 animate-pulse rounded bg-sand" />
        <div className="h-36 animate-pulse rounded-panel bg-sand" />
        <div className="h-[500px] animate-pulse rounded-panel bg-sand" />
      </div>
    );
  }

  if (loadError && edit) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <Link
          to="/employer/jobs"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-wine"
        >
          <ArrowLeft size={16} />
          Back to jobs
        </Link>

        <div className="rounded-panel border border-danger/20 bg-danger-soft p-6 sm:p-8">
          <CircleAlert size={28} className="text-danger" />
          <h1 className="mt-4 font-heading text-xl font-extrabold text-ink">
            Unable to load this job
          </h1>
          <p className="mt-2 text-sm text-danger/80">{loadError}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchJob}
              className="rounded-control bg-danger px-4 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>
            <Link
              to="/employer/jobs"
              className="rounded-control border border-border px-4 py-2.5 text-sm font-bold text-ink"
            >
              Back to listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-sand/20 bg-sand/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-sand">
              <BriefcaseBusiness size={13} />
              Employer workspace
            </span>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              {edit ? "Edit your listing" : "Create a job listing"}
              <span className="text-sand">.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-sand/75 sm:text-base">
              {edit
                ? "Update your opportunity details and keep your listing accurate."
                : "Create a clear, compelling opportunity that attracts the right candidates."}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-sand/75">
            <Sparkles size={16} />
            {edit ? "Listing editor" : "New opportunity"}
          </div>
        </div>
      </motion.section>

      {/* Form layout */}
      <form onSubmit={submit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Basic information */}
          <section className="rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-wine-soft p-2.5 text-wine">
                <Building2 size={19} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-extrabold text-ink">
                  Basic information
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Introduce the role and the organization.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InputField
                label="Job title"
                value={form.title}
                onChange={(value) => update("title", value)}
                placeholder="e.g. Frontend Developer"
                required
              />

              <InputField
                label="Company name"
                value={form.company}
                onChange={(value) => update("company", value)}
                placeholder="Your company name"
                required
              />

              <InputField
                label="Location"
                value={form.location}
                onChange={(value) => update("location", value)}
                placeholder="Chennai, India / Remote"
                required
              />

              <InputField
                label="Salary range"
                value={form.salary}
                onChange={(value) => update("salary", value)}
                placeholder="e.g. ₹3–5 LPA"
              />
            </div>
          </section>

          {/* Employment details */}
          <section className="rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-wine-soft p-2.5 text-wine">
                <BriefcaseBusiness size={19} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-extrabold text-ink">
                  Employment details
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Help candidates understand the level and type of role.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block">
                <FieldLabel required>Job type</FieldLabel>
                <select
                  value={form.jobType}
                  onChange={(event) =>
                    update("jobType", event.target.value as JobType)
                  }
                  className="nx-input w-full"
                >
                  {jobTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <FieldLabel required>Experience level</FieldLabel>
                <select
                  value={form.experienceLevel}
                  onChange={(event) =>
                    update(
                      "experienceLevel",
                      event.target.value as ExperienceLevel
                    )
                  }
                  className="nx-input w-full"
                >
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Skills */}
          <section className="rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-wine-soft p-2.5 text-wine">
                <CheckCircle2 size={19} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-extrabold text-ink">
                  Required skills
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Add the skills candidates should have for this role.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={skillsInput}
                onChange={(event) => setSkillsInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Type a skill, e.g. React"
                className="nx-input min-w-0 flex-1"
              />

              <button
                type="button"
                onClick={addSkill}
                className="inline-flex shrink-0 items-center gap-2 rounded-control bg-wine px-4 py-2.5 text-sm font-bold text-sand-light transition hover:bg-wine-dark"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 rounded-full border border-wine/10 bg-wine-soft px-3 py-2 text-xs font-bold text-wine"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      className="rounded-full transition hover:text-danger"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-subtle">
                  No skills added yet. You can also leave this optional field empty.
                </p>
              )}
            </div>
          </section>

          {/* Description */}
          <section className="rounded-panel border border-border bg-sand-light p-5 shadow-soft sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-xl bg-wine-soft p-2.5 text-wine">
                <FileText size={19} />
              </div>
              <div>
                <h2 className="font-heading text-lg font-extrabold text-ink">
                  Job description
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Explain the responsibilities and expectations clearly.
                </p>
              </div>
            </div>

            <label className="block">
              <FieldLabel required>Description</FieldLabel>
              <textarea
                rows={11}
                value={form.description}
                onChange={(event) =>
                  update("description", event.target.value)
                }
                required
                minLength={30}
                maxLength={10000}
                placeholder={`Describe the role, responsibilities, requirements, and what success looks like.

Example:
• Build and maintain responsive web applications.
• Collaborate with designers and backend developers.
• Write clean, maintainable code.`}
                className="nx-input min-h-64 w-full resize-y leading-7"
              />

              <span className="mt-2 block text-right text-xs text-subtle">
                {form.description.length}/10,000 characters
              </span>
            </label>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/employer/jobs"
              className="inline-flex items-center justify-center rounded-control border border-border px-5 py-3 text-sm font-bold text-muted transition hover:bg-sand hover:text-ink"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={busy || loadingJob}
              className="inline-flex items-center justify-center gap-2 rounded-control bg-wine px-6 py-3 text-sm font-bold text-sand-light shadow-wine transition hover:bg-wine-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Clock3 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {busy
                ? "Saving..."
                : edit
                  ? "Save changes"
                  : "Publish job"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <aside className="h-fit space-y-4 xl:sticky xl:top-6">
          <div className="rounded-panel border border-border bg-sand-light p-5 shadow-soft">
            <div className="flex items-center gap-2 text-wine">
              <Sparkles size={17} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Live preview
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-muted">
              This is a quick preview of the information candidates will see.
            </p>

            <div className="mt-5 rounded-card border border-border bg-white p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-wine text-base font-extrabold text-sand">
                {form.company.trim().charAt(0).toUpperCase() || "C"}
              </div>

              <h3 className="mt-4 break-words font-heading text-lg font-extrabold text-ink">
                {form.title || "Your job title"}
              </h3>

              <p className="mt-1 text-sm font-semibold text-wine">
                {form.company || "Company name"}
              </p>

              <div className="mt-4 space-y-2 text-xs text-muted">
                <p className="flex items-center gap-2">
                  <MapPin size={14} />
                  {form.location || "Job location"}
                </p>
                <p className="flex items-center gap-2">
                  <BriefcaseBusiness size={14} />
                  {form.jobType}
                </p>
                <p className="flex items-center gap-2">
                  <Clock3 size={14} />
                  {form.experienceLevel}
                </p>
                {form.salary && (
                  <p className="flex items-center gap-2">
                    <Wallet size={14} />
                    {form.salary}
                  </p>
                )}
              </div>

              {skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold text-muted"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 5 && (
                    <span className="rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold text-muted">
                      +{skills.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-bold text-ink">
                  Job description
                </p>
                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-muted">
                  {form.description
                    ? `${form.description.slice(0, 180)}${
                        form.description.length > 180 ? "..." : ""
                      }`
                    : "Your job description will appear here."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-wine/10 bg-wine-soft p-5">
            <div className="flex items-center gap-2 text-wine">
              <Check size={17} />
              <p className="text-sm font-extrabold">Publishing checklist</p>
            </div>

            <ul className="mt-4 space-y-3 text-xs font-medium text-muted">
              {[
                ["Job title", Boolean(form.title.trim())],
                ["Company name", Boolean(form.company.trim())],
                ["Location", Boolean(form.location.trim())],
                ["Job description", form.description.trim().length >= 30],
              ].map(([label, complete]) => (
                <li key={String(label)} className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      complete
                        ? "bg-success text-white"
                        : "bg-white text-subtle"
                    }`}
                  >
                    {complete ? <Check size={12} /> : <span className="text-[10px]">•</span>}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}
