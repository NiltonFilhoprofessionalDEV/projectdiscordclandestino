import { cn } from "../../lib/utils.ts";

type PulseLineProps = {
  active: boolean;
  className?: string;
};

export function PulseLine({ active, className }: PulseLineProps) {
  return (
    <span
      className={cn(
        "pulse-line block h-px rounded-full",
        active ? "opacity-100" : "opacity-55",
        className,
      )}
      aria-hidden
    />
  );
}
