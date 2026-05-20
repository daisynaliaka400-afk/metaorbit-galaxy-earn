export function MetaOrbitLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="mo-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="oklch(0.7 0.22 285)" />
          <stop offset="50%" stopColor="oklch(0.78 0.22 305)" />
          <stop offset="100%" stopColor="oklch(0.78 0.18 195)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="6" fill="url(#mo-grad)" />
      <ellipse cx="20" cy="20" rx="17" ry="7" stroke="url(#mo-grad)" strokeWidth="1.5" transform="rotate(-25 20 20)" />
      <ellipse cx="20" cy="20" rx="17" ry="7" stroke="url(#mo-grad)" strokeWidth="1.5" strokeOpacity="0.6" transform="rotate(40 20 20)" />
      <circle cx="36" cy="14" r="1.8" fill="oklch(0.78 0.18 195)" />
    </svg>
  );
}

export function MetaOrbitWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MetaOrbitLogo className="h-8 w-8" />
      <span className="font-display text-lg font-bold tracking-tight">
        META <span className="text-gradient-orbit">ORBIT</span>
      </span>
    </div>
  );
}
