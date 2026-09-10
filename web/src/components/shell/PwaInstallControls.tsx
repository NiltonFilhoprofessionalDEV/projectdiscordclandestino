import { Download, X } from "lucide-react";
import { IconButton } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { Tooltip } from "../ui/tooltip.tsx";

type InstallActionProps = {
  label: string;
  onInstall: () => void;
};

export function PwaInstallHint({
  label,
  onInstall,
  onDismiss,
}: InstallActionProps & { onDismiss: () => void }) {
  return (
    <div className="border-t border-white/[0.07] bg-[#0A0B11] px-2 pt-2">
      <div className="flex items-center gap-1 rounded-xl border border-electric/30 bg-[rgba(124,58,237,0.12)] px-2 py-1.5">
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold tracking-wide text-cloud"
          onClick={onInstall}
        >
          {label}
        </button>
        <IconButton
          type="button"
          size="iconSm"
          variant="ghost"
          className="size-7 min-h-7 min-w-7 shrink-0"
          aria-label="Dispensar"
          onClick={onDismiss}
        >
          <Icon icon={X} size="sm" />
        </IconButton>
      </div>
    </div>
  );
}

export function PwaInstallButton({ label, onInstall }: InstallActionProps) {
  return (
    <Tooltip label={label}>
      <IconButton
        type="button"
        size="iconSm"
        variant="ghost"
        className="shrink-0"
        onClick={onInstall}
        aria-label={label}
      >
        <Icon icon={Download} size="action" />
      </IconButton>
    </Tooltip>
  );
}
