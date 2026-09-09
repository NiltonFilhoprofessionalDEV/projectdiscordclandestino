import { cn } from "../../lib/utils.ts";

type LoadingProps = {
  label?: string;
  className?: string;
};

export function Loading({ label, className }: LoadingProps) {
  return (
    <div
      className={cn("flex items-center gap-2.5 text-sm text-haze", className)}
      role="status"
    >
      <span className="loading-ring" aria-hidden />
      {label ? <span>{label}</span> : <span className="sr-only">Carregando</span>}
    </div>
  );
}
