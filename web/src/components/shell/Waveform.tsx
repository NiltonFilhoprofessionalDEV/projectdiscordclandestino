import { cn } from "../../lib/utils.ts";

const BARS = [0.4, 0.7, 1, 0.55, 0.9, 0.45, 0.8, 0.6, 1, 0.5, 0.75, 0.35];

type WaveformProps = {
  className?: string;
};

export function Waveform({ className }: WaveformProps) {
  return (
    <div className={cn("flex h-6 items-end gap-[3px]", className)} aria-hidden>
      {BARS.map((height, index) => (
        <span
          key={index}
          className="wave-bar w-[3px] rounded-full bg-linear-to-t from-amber-400 via-copper to-violet"
          style={{
            height: `${height * 100}%`,
            animationDelay: `${index * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}
