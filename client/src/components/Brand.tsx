
import { BriefcaseBusiness } from "lucide-react";

type BrandProps = {
  compact?: boolean;
  light?: boolean;
};

export default function Brand({
  compact = false,
  light = false,
}: BrandProps) {
  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${
        light ? "text-sand-light" : "text-wine-dark"
      }`}
      aria-label="NexHire"
    >
      {/* Brand Icon */}

      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 hover:scale-105 ${
          light
            ? "border border-sand/20 bg-sand/10 text-sand"
            : "border border-wine/10 bg-wine text-sand"
        }`}
      >
        <BriefcaseBusiness size={20} strokeWidth={2} />
      </span>

      {/* Brand Name */}

      {!compact && (
        <span className="font-heading text-xl font-extrabold tracking-[-1px]">
          Nex
          <span className={light ? "text-sand" : "text-wine"}>
            Hire
          </span>
        </span>
      )}
    </div>
  );
}
