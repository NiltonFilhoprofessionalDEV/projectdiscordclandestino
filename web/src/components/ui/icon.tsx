import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils.ts";

export const ICON_STROKE = 1.9;

const SIZE_CLASS = {
  sm: "size-4",
  action: "size-[18px]",
  md: "size-5",
  lg: "size-[22px]",
  nav: "size-6",
  hero: "size-7",
} as const;

type IconProps = {
  icon: LucideIcon;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
};

export function Icon({ icon: Glyph, size = "md", className }: IconProps) {
  return (
    <Glyph aria-hidden className={cn("shrink-0", SIZE_CLASS[size], className)} strokeWidth={ICON_STROKE} />
  );
}
