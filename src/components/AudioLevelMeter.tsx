"use client";

interface AudioLevelMeterProps {
  level: number;
}

export function AudioLevelMeter({ level }: AudioLevelMeterProps) {
  const bars = 20;

  return (
    <div className="flex h-12 items-end gap-1 rounded-xl bg-slate-900/95 p-2" aria-hidden="true">
      {Array.from({ length: bars }).map((_, index) => {
        const bandProgress = (index + 1) / bars;
        const active = level >= bandProgress * 0.75;
        const height = Math.max(12, Math.round((index % 5 === 0 ? 0.75 : 1) * 34 * Math.max(level, 0.12)));

        return (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`w-1.5 rounded-full transition-all duration-75 ${active ? "bg-emerald-300" : "bg-slate-600"}`}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}