
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ElementType, ReactNode } from "react";

import {
  Building2,
  Globe,
  MapPin,
  BriefcaseBusiness,
  Users,
  Phone,
  Linkedin,
  Save,
  X,
  Pencil,
  Loader2,
  RefreshCw,
  ImagePlus,
  Mail,
  CheckCircle2,
  AlertCircle,
  Camera,
  ExternalLink,
  FileText,
  ShieldCheck,
} from "lucide-react";

import toast from "react-hot-toast";
import { authApi, uploadApi } from "../api/services";
import type { EmployerCompanyProfile } from "../types";
import { getApiError } from "../api/client";

type CompanyForm = Omit<EmployerCompanyProfile, "name" | "email">;

type FieldErrors = Partial<
  Record<
    | "companyName"
    | "website"
    | "industry"
    | "location"
    | "companySize"
    | "description"
    | "recruiterPhone"
    | "linkedinUrl",
    string
  >
>;

const emptyForm: CompanyForm = {
  companyName: "",
  logoUrl: null,
  website: "",
  industry: "",
  location: "",
  companySize: "",
  description: "",
  recruiterPhone: "",
  linkedinUrl: "",
};

const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const inputClass =
  "w-full rounded-control border border-border bg-sand-light px-4 py-3 text-sm text-ink outline-none transition-all duration-200 placeholder:text-subtle focus:border-wine focus:ring-2 focus:ring-wine/10 disabled:cursor-not-allowed disabled:bg-sand disabled:opacity-75";

const errorInputClass =
  "!border-red-400 !ring-2 !ring-red-100";

interface FieldProps {
  label: string;
  htmlFor: string;
  icon?: ElementType;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
}

function Field({
  label,
  htmlFor,
  icon: Icon,
  children,
  hint,
  error,
  required,
}: FieldProps) {
  return (
    <div className="min-w-0 space-y-2">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-xs font-bold text-ink"
      >
        {Icon && <Icon size={15} className="shrink-0 text-wine" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      {children}

      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[11px] text-red-600"
        >
          <AlertCircle size={13} />
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] leading-5 text-muted">{hint}</p>
      )}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[9px] font-extrabold tracking-[2px] text-wine">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-lg font-extrabold text-ink">
        {title}
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="h-48 rounded-card bg-wine/10" />

      <div className="rounded-card border border-border bg-sand-light p-6">
        <div className="h-5 w-40 rounded bg-border" />
        <div className="mt-6 flex items-center gap-5">
          <div className="h-24 w-24 rounded-2xl bg-border" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-40 rounded bg-border" />
            <div className="h-3 w-56 max-w-full rounded bg-border" />
            <div className="h-9 w-32 rounded-lg bg-border" />
          </div>
        </div>
      </div>

      {[1, 2].map((item) => (
        <div
          key={item}
          className="rounded-card border border-border bg-sand-light p-6"
        >
          <div className="h-5 w-44 rounded bg-border" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((field) => (
              <div key={field} className="space-y-2">
                <div className="h-3 w-28 rounded bg-border" />
                <div className="h-11 rounded-control bg-border" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getCompanyForm(
  data: EmployerCompanyProfile
): CompanyForm {
  return {
    companyName: data.companyName ?? "",
    logoUrl: data.logoUrl ?? null,
    website: data.website ?? "",
    industry: data.industry ?? "",
    location: data.location ?? "",
    companySize: data.companySize ?? "",
    description: data.description ?? "",
    recruiterPhone: data.recruiterPhone ?? "",
    linkedinUrl: data.linkedinUrl ?? "",
  };
}

function validateHttpUrl(value: string) {
  if (!value.trim()) return "";

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "URL must start with http:// or https://.";
    }

    return "";
  } catch {
    return "Enter a valid URL, including https://.";
  }
}

function validateCompanyForm(form: CompanyForm): FieldErrors {
  const errors: FieldErrors = {};

  const companyName = form.companyName.trim();

  if (!companyName) {
    errors.companyName = "Company name is required.";
  } else if (companyName.length < 2) {
    errors.companyName = "Company name must contain at least 2 characters.";
  } else if (companyName.length > 120) {
    errors.companyName = "Company name cannot exceed 120 characters.";
  }

  if (form.website.trim()) {
    const error = validateHttpUrl(form.website);
    if (error) errors.website = error;
  }

  if (form.linkedinUrl.trim()) {
    const error = validateHttpUrl(form.linkedinUrl);

    if (error) {
      errors.linkedinUrl = error;
    } else {
      try {
        const hostname = new URL(form.linkedinUrl.trim()).hostname
          .toLowerCase()
          .replace(/^www\./, "");

        if (
          hostname !== "linkedin.com" &&
          !hostname.endsWith(".linkedin.com")
        ) {
          errors.linkedinUrl = "Enter a valid LinkedIn URL.";
        }
      } catch {
        errors.linkedinUrl = "Enter a valid LinkedIn URL.";
      }
    }
  }

  if (form.description.length > 2000) {
    errors.description = "Description cannot exceed 2000 characters.";
  }

  if (form.recruiterPhone.trim()) {
    const digits = form.recruiterPhone.replace(/\D/g, "");

    if (digits.length < 7 || digits.length > 15) {
      errors.recruiterPhone = "Enter a valid phone number.";
    }
  }

  return errors;
}

export default function EmployerProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] =
    useState<EmployerCompanyProfile | null>(null);

  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [initialForm, setInitialForm] = useState<CompanyForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editing, setEditing] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [showAllErrors, setShowAllErrors] = useState(false);

  // Create and clean up the temporary local logo preview URL.
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  // Load employer company profile.
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const response = await authApi.employerProfile();
      const data = response.data.profile;

      if (!data) {
        throw new Error("Company profile was not returned by the server.");
      }

      const companyData = getCompanyForm(data);

      setProfile(data);
      setForm(companyData);
      setInitialForm(companyData);
      setLogoFile(null);
      setErrors({});
      setShowAllErrors(false);
      setEditing(false);
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // Detect unsaved changes.
  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(form) !== JSON.stringify(initialForm) ||
      logoFile !== null
    );
  }, [form, initialForm, logoFile]);

  // Warn before leaving the browser page with unsaved changes.
  useEffect(() => {
    if (!editing || !hasChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [editing, hasChanges]);

  // Calculate completion from actual profile fields.
  const completionItems = useMemo(
    () => [
      Boolean(form.companyName.trim()),
      Boolean(form.logoUrl || logoFile),
      Boolean(form.website.trim()),
      Boolean(form.industry.trim()),
      Boolean(form.location.trim()),
      Boolean(form.companySize),
      Boolean(form.description.trim()),
      Boolean(form.recruiterPhone.trim()),
      Boolean(form.linkedinUrl.trim()),
    ],
    [form, logoFile]
  );

  const completedFields = completionItems.filter(Boolean).length;
  const completionPercentage = Math.round(
    (completedFields / completionItems.length) * 100
  );

  // Update individual form fields.
  const updateField = <K extends keyof CompanyForm>(
    key: K,
    value: CompanyForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    if (showAllErrors || errors[key as keyof FieldErrors]) {
      setErrors((current) => ({
        ...current,
        [key]: undefined,
      }));
    }
  };

  const handleBlur = (key: keyof FieldErrors) => {
    const nextErrors = validateCompanyForm(form);

    setErrors((current) => ({
      ...current,
      [key]: nextErrors[key],
    }));
  };

  // Validate the form before saving.
  const validateForm = () => {
    const nextErrors = validateCompanyForm(form);

    setErrors(nextErrors);
    setShowAllErrors(true);

    return Object.keys(nextErrors).length === 0;
  };

  // Save company profile and staged logo.
  const handleSave = async () => {
    if (saving || uploadingLogo) return;

    if (!hasChanges) {
      toast("No changes to save.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    try {
      setSaving(true);

      let uploadedLogoUrl = form.logoUrl;

      // Upload the selected logo only after Save is clicked.
      if (logoFile) {
        setUploadingLogo(true);

        const uploadResponse = await uploadApi.companyLogo(logoFile);
        uploadedLogoUrl = uploadResponse.data.logoUrl;

        setUploadingLogo(false);
      }

      const payload = {
        companyName: form.companyName.trim(),
        website: form.website.trim(),
        industry: form.industry.trim(),
        location: form.location.trim(),
        companySize: form.companySize,
        description: form.description.trim(),
        recruiterPhone: form.recruiterPhone.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
      };

      const response = await authApi.updateEmployerProfile(payload);
      const updated = response.data.profile;

      if (!updated) {
        throw new Error("Updated profile was not returned by the server.");
      }

      const updatedForm = {
        ...getCompanyForm(updated),
        logoUrl: updated.logoUrl ?? uploadedLogoUrl ?? null,
      };

      setProfile({
        ...updated,
        logoUrl: updated.logoUrl ?? uploadedLogoUrl ?? null,
      });

      setForm(updatedForm);
      setInitialForm(updatedForm);
      setLogoFile(null);
      setErrors({});
      setShowAllErrors(false);
      setEditing(false);

      toast.success("Company profile updated successfully.");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setSaving(false);
      setUploadingLogo(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Discard unsaved form changes.
  const handleCancel = () => {
    if (saving || uploadingLogo) return;

    if (
      hasChanges &&
      !window.confirm("Discard all unsaved changes?")
    ) {
      return;
    }

    setForm(initialForm);
    setLogoFile(null);
    setErrors({});
    setShowAllErrors(false);
    setEditing(false);
    setLogoLoadError(false);
  };

  // Stage logo selection for preview. Upload happens on Save.
  const handleLogoSelection = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    if (!editing) {
      toast.error("Click Edit profile before changing the logo.");
      event.target.value = "";
      return;
    }

    setLogoFile(file);
    setLogoLoadError(false);
    toast("Logo preview ready. Save to upload it.");
  };

  // Loading state.
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-5">
        <ProfileSkeleton />
      </div>
    );
  }

  // Error state.
  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-xl items-center justify-center px-4">
        <div className="w-full rounded-card border border-border bg-sand-light p-8 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-wine-soft text-wine">
            <Building2 size={28} />
          </div>

          <h2 className="mt-4 font-heading text-xl font-extrabold text-ink">
            Unable to load your profile
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            Check your connection and try again.
          </p>

          <button
            type="button"
            onClick={() => void loadProfile()}
            className="nx-button nx-button-primary mt-5"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const displayedLogo = logoPreview || form.logoUrl;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28 sm:space-y-7">

      {/* Page header */}

      <section className="relative overflow-hidden rounded-card bg-wine px-6 py-8 text-sand-light shadow-wine sm:px-9 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -top-10 h-44 w-44 rounded-full border border-white/10"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-48 rounded-full bg-white/5 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-[2px] text-sand/70">
              <Building2 size={14} />
              EMPLOYER WORKSPACE
            </div>

            <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              Company profile
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-sand/75">
              Manage your company's identity and recruiter information.
            </p>
          </div>

          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-sand-light px-5 py-3 text-sm font-extrabold text-wine transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Pencil size={16} />
              Edit profile
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex min-h-11 items-center gap-2 rounded-control border border-white/25 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !hasChanges}
                className="inline-flex min-h-11 items-center gap-2 rounded-control bg-sand-light px-5 py-3 text-sm font-extrabold text-wine transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Company overview and completion */}

      <section className="grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="flex min-w-0 items-center gap-4 rounded-card border border-border bg-sand-light p-5 shadow-soft sm:p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-sand">
            {displayedLogo && !logoLoadError ? (
              <img
                src={displayedLogo}
                alt={`${form.companyName || "Company"} logo`}
                className="h-full w-full object-contain p-2"
                onError={() => setLogoLoadError(true)}
              />
            ) : (
              <Building2 size={27} className="text-wine/50" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold tracking-[1.5px] text-wine">
              COMPANY OVERVIEW
            </p>

            <h2 className="mt-1 truncate font-heading text-lg font-extrabold text-ink">
              {form.companyName || "Your company"}
            </h2>

            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
              {form.industry || "Industry not added"}
              {form.location && (
                <>
                  <span>·</span>
                  <MapPin size={12} />
                  {form.location}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-card border border-border bg-sand-light p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink">
              Profile completion
            </span>
            <span className="font-heading text-xl font-extrabold text-wine">
              {completionPercentage}%
            </span>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-label="Company profile completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPercentage}
          >
            <div
              className="h-full rounded-full bg-wine transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <p className="mt-2 text-[10px] leading-5 text-muted">
            {completedFields} of {completionItems.length} profile details
            completed.
          </p>
        </div>
      </section>

      {/* Company identity */}

      <section className="rounded-card border border-border bg-sand-light p-5 shadow-soft sm:p-7">
        <SectionHeading
          eyebrow="01 / BRAND"
          title="Company identity"
          description="Your company's public identity on NexHire."
        />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-sand">
            {displayedLogo && !logoLoadError ? (
              <img
                src={displayedLogo}
                alt={`${form.companyName || "Company"} logo preview`}
                className="h-full w-full object-contain p-2"
                onError={() => setLogoLoadError(true)}
              />
            ) : (
              <Building2 size={38} className="text-wine/50" />
            )}

            {uploadingLogo && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
                <Loader2
                  className="animate-spin text-white"
                  size={25}
                />
              </div>
            )}

            {logoFile && (
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-wine px-2 py-1 text-[8px] font-bold text-white">
                PREVIEW
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-ink">
              {form.companyName || "Your company"}
            </h3>

            <p className="mt-1 text-xs leading-5 text-muted">
              Upload a clear company logo. JPG, PNG or WEBP. Maximum file size:
              2 MB.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={!editing || saving}
              onChange={handleLogoSelection}
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!editing || saving || uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border px-4 py-2.5 text-xs font-bold text-wine transition hover:border-wine hover:bg-wine-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera size={15} />
                {logoFile || form.logoUrl ? "Change logo" : "Upload logo"}
              </button>

              {logoFile && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setLogoFile(null);
                    setLogoLoadError(false);

                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-control px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <X size={14} />
                  Discard preview
                </button>
              )}
            </div>

            {logoFile && (
              <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-wine">
                <CheckCircle2 size={13} />
                Preview ready. Click Save changes to upload.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Company information */}

      <section className="rounded-card border border-border bg-sand-light p-5 shadow-soft sm:p-7">
        <SectionHeading
          eyebrow="02 / ORGANIZATION"
          title="Company information"
          description="Help candidates understand your organization."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Company name"
            htmlFor="companyName"
            icon={Building2}
            required
            error={errors.companyName}
          >
            <input
              id="companyName"
              className={`${inputClass} ${errors.companyName ? errorInputClass : ""}`}
              value={form.companyName}
              disabled={!editing || saving}
              maxLength={120}
              placeholder="e.g. NexHire Technologies"
              aria-invalid={Boolean(errors.companyName)}
              aria-describedby={
                errors.companyName ? "companyName-error" : undefined
              }
              onChange={(event) =>
                updateField("companyName", event.target.value)
              }
              onBlur={() => handleBlur("companyName")}
            />
            <p className="text-right text-[10px] text-muted">
              {form.companyName.length}/120
            </p>
          </Field>

          <Field
            label="Website"
            htmlFor="website"
            icon={Globe}
            error={errors.website}
            hint="Include https:// in your website address."
          >
            <input
              id="website"
              type="url"
              className={`${inputClass} ${errors.website ? errorInputClass : ""}`}
              value={form.website}
              disabled={!editing || saving}
              placeholder="https://example.com"
              aria-invalid={Boolean(errors.website)}
              aria-describedby={errors.website ? "website-error" : undefined}
              onChange={(event) =>
                updateField("website", event.target.value)
              }
              onBlur={() => handleBlur("website")}
            />
          </Field>

          <Field
            label="Industry"
            htmlFor="industry"
            icon={BriefcaseBusiness}
          >
            <input
              id="industry"
              className={inputClass}
              value={form.industry}
              disabled={!editing || saving}
              maxLength={100}
              placeholder="Information Technology"
              onChange={(event) =>
                updateField("industry", event.target.value)
              }
            />
          </Field>

          <Field
            label="Company location"
            htmlFor="location"
            icon={MapPin}
          >
            <input
              id="location"
              className={inputClass}
              value={form.location}
              disabled={!editing || saving}
              maxLength={120}
              placeholder="Chennai, India"
              onChange={(event) =>
                updateField("location", event.target.value)
              }
            />
          </Field>

          <Field
            label="Company size"
            htmlFor="companySize"
            icon={Users}
          >
            <select
              id="companySize"
              className={inputClass}
              value={form.companySize}
              disabled={!editing || saving}
              onChange={(event) =>
                updateField("companySize", event.target.value)
              }
            >
              <option value="">Select company size</option>

              {companySizes.map((size) => (
                <option key={size} value={size}>
                  {size} employees
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="LinkedIn company URL"
            htmlFor="linkedinUrl"
            icon={Linkedin}
            error={errors.linkedinUrl}
          >
            <input
              id="linkedinUrl"
              type="url"
              className={`${inputClass} ${errors.linkedinUrl ? errorInputClass : ""}`}
              value={form.linkedinUrl}
              disabled={!editing || saving}
              placeholder="https://linkedin.com/company/..."
              aria-invalid={Boolean(errors.linkedinUrl)}
              aria-describedby={
                errors.linkedinUrl ? "linkedinUrl-error" : undefined
              }
              onChange={(event) =>
                updateField("linkedinUrl", event.target.value)
              }
              onBlur={() => handleBlur("linkedinUrl")}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Company description"
              htmlFor="description"
              icon={FileText}
              error={errors.description}
              hint="Describe your company, culture and what makes your workplace different."
            >
              <textarea
                id="description"
                className={`${inputClass} min-h-36 resize-y leading-6 ${errors.description ? errorInputClass : ""}`}
                value={form.description}
                disabled={!editing || saving}
                maxLength={2000}
                placeholder="Tell candidates about your company, culture and what makes your workplace different..."
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "description-error" : undefined
                }
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                onBlur={() => handleBlur("description")}
              />

              <p className="mt-1 text-right text-[11px] text-muted">
                {form.description.length}/2000
              </p>
            </Field>
          </div>
        </div>
      </section>

      {/* Recruiter information */}

      <section className="rounded-card border border-border bg-sand-light p-5 shadow-soft sm:p-7">
        <SectionHeading
          eyebrow="03 / CONTACT"
          title="Recruiter information"
          description="Contact details associated with your employer account."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Recruiter name"
            htmlFor="recruiterName"
            icon={Users}
            hint="Managed through your account profile."
          >
            <input
              id="recruiterName"
              className={inputClass}
              value={profile.name}
              disabled
            />
          </Field>

          <Field
            label="Account email"
            htmlFor="accountEmail"
            icon={Mail}
            hint="Your registered employer email."
          >
            <input
              id="accountEmail"
              type="email"
              className={inputClass}
              value={profile.email}
              disabled
            />
          </Field>

          <Field
            label="Recruiter phone"
            htmlFor="recruiterPhone"
            icon={Phone}
            error={errors.recruiterPhone}
            hint="Include your country code where applicable."
          >
            <input
              id="recruiterPhone"
              type="tel"
              className={`${inputClass} ${errors.recruiterPhone ? errorInputClass : ""}`}
              value={form.recruiterPhone}
              disabled={!editing || saving}
              maxLength={20}
              placeholder="+91 98765 43210"
              aria-invalid={Boolean(errors.recruiterPhone)}
              aria-describedby={
                errors.recruiterPhone
                  ? "recruiterPhone-error"
                  : undefined
              }
              onChange={(event) =>
                updateField("recruiterPhone", event.target.value)
              }
              onBlur={() => handleBlur("recruiterPhone")}
            />
          </Field>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-wine/10 bg-wine-soft/50 p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-wine" />
          <p className="text-[11px] leading-5 text-muted">
            Your recruiter account name and email are managed separately.
            Contact details entered here are associated with your company
            profile.
          </p>
        </div>
      </section>

      {/* Profile links preview */}

      <section className="rounded-card border border-border bg-sand-light p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-base font-extrabold text-ink">
              Company links
            </h2>
            <p className="mt-1 text-xs text-muted">
              Review the links candidates may use to learn about your company.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.website && (
              <a
                href={form.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 py-2 text-[10px] font-bold text-wine transition hover:border-wine hover:bg-wine-soft"
              >
                <Globe size={13} />
                Website
                <ExternalLink size={11} />
              </a>
            )}

            {form.linkedinUrl && !errors.linkedinUrl && (
              <a
                href={form.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 py-2 text-[10px] font-bold text-wine transition hover:border-wine hover:bg-wine-soft"
              >
                <Linkedin size={13} />
                LinkedIn
                <ExternalLink size={11} />
              </a>
            )}

            {!form.website && !form.linkedinUrl && (
              <span className="text-xs text-muted">
                No company links added yet.
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Sticky save bar */}

      {editing && (
        <div className="sticky bottom-3 z-20">
          <div className="flex flex-col gap-3 rounded-2xl border border-wine/15 bg-sand-light/95 p-4 shadow-[0_12px_40px_rgba(40,20,30,0.14)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              {hasChanges ? (
                <>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">
                      Unsaved changes
                    </p>
                    <p className="text-[10px] text-muted">
                      Save your updates before leaving this page.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-emerald-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-ink">
                      All changes saved
                    </p>
                    <p className="text-[10px] text-muted">
                      Edit your details whenever you need to.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving || uploadingLogo}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-control border border-border px-4 py-2.5 text-xs font-bold text-muted transition hover:bg-sand hover:text-ink disabled:opacity-50 sm:flex-none"
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || uploadingLogo || !hasChanges}
                className="nx-button nx-button-primary min-h-11 flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {saving || uploadingLogo ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}

                {uploadingLogo
                  ? "Uploading logo..."
                  : saving
                    ? "Saving..."
                    : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
