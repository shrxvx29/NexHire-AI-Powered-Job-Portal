
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: StatCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-card border border-border bg-sand-light p-5 shadow-soft transition-shadow duration-300 hover:border-wine/20 hover:shadow-card"
    >
      {/* Decorative background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-wine-soft/50 transition-transform duration-500 group-hover:scale-125"
      />

      <div className="relative z-10">
        {/* Label and icon */}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-muted">
            {label}
          </p>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-wine/10 bg-wine-soft text-wine transition-colors duration-300 group-hover:bg-wine group-hover:text-sand">
            <Icon size={19} strokeWidth={1.9} />
          </div>
        </div>

        {/* Main value */}

        <div className="mt-5">
          <strong className="block font-heading text-3xl font-extrabold tracking-tight text-ink tabular-nums">
            {value}
          </strong>

          <p className="mt-2 text-[11px] leading-5 text-muted">
            {hint}
          </p>
        </div>

        {/* Bottom accent */}

        <div className="mt-5 h-1 w-10 rounded-full bg-wine/20 transition-all duration-300 group-hover:w-16 group-hover:bg-wine" />
      </div>
    </motion.div>
  );
}
