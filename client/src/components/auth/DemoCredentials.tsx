
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";
import toast from "react-hot-toast";

type DemoAccount = {
  role: "seeker" | "employer";
  label: string;
  email: string;
  password: string;
  icon: typeof UserRound;
};

const demoAccounts: DemoAccount[] = [
  {
    role: "seeker",
    label: "Job Seeker",
    email: "jobseeker@gmail.com",
    password: "Test@12345",
    icon: UserRound,
  },
  {
    role: "employer",
    label: "Employer",
    email: "employer@gmail.com",
    password: "Test@12345",
    icon: BriefcaseBusiness,
  },
];

export default function DemoCredentials() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");

  const copyValue = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      toast.success(`${field} copied`);

      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
  };

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-wine/15 bg-wine/5 px-4 py-3 text-left transition hover:border-wine/30 hover:bg-wine/10"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-wine">
          <UserRound size={15} />
          Demo credentials
        </span>

        {open ? (
          <ChevronUp size={16} className="text-wine" />
        ) : (
          <ChevronDown size={16} className="text-wine" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {demoAccounts.map((account) => {
            const Icon = account.icon;

            return (
              <div
                key={account.role}
                className="rounded-xl border border-border bg-sand-light p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Icon size={16} className="text-wine" />
                  <span className="text-xs font-bold text-wine-dark">
                    {account.label}
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Email", value: account.email },
                    { label: "Password", value: account.password },
                  ].map((field) => {
                    const key = `${account.role}-${field.label}`;

                    return (
                      <div key={key}>
                        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-muted">
                          {field.label}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <span className="break-all text-[11px] text-ink">
                            {field.value}
                          </span>

                          <button
                            type="button"
                            onClick={() => copyValue(field.value, field.label)}
                            aria-label={`Copy ${field.label}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wine transition hover:bg-wine/10"
                          >
                            {copied === field.label ? (
                              <Check size={15} />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <p className="text-[10px] leading-5 text-muted">
            These accounts are provided for exploring NexHire.
            Demo data may be shared with other visitors.
          </p>
        </div>
      )}
    </div>
  );
}
