import { useEffect, useState } from "react";
import type { CommunityId } from "../../../../shared/community.ts";
import { createInvite } from "../../services/api.ts";
import { inviteUrl } from "../../invites/path.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type InviteDialogProps = {
  open: boolean;
  communityId: CommunityId | null;
  communityName: string;
  onClose: () => void;
};

export function InviteDialog({
  open,
  communityId,
  communityName,
  onClose,
}: InviteDialogProps) {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !communityId) {
      return;
    }
    let cancelled = false;
    setPending(true);
    setError(null);
    setLink("");
    setCopied(false);
    void createInvite(communityId).then((result) => {
      if (cancelled) {
        return;
      }
      setPending(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setLink(inviteUrl(result.data.token));
    });
    return () => {
      cancelled = true;
    };
  }, [open, communityId]);

  async function copyLink() {
    if (!link) {
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  return (
    <AppDialog
      open={open}
      titleId="invite-dialog-title"
      title="Convidar amigos"
      description={`Quem abrir o link entra em “${communityName}” (precisa estar logado).`}
      onClose={onClose}
    >
      <div className="mt-5 space-y-3">
        {pending ? <p className="text-sm text-haze">Gerando link…</p> : null}
        {error ? (
          <p className="text-sm text-coral" role="alert">
            {error}
          </p>
        ) : null}
        {link ? (
          <>
            <label className="text-sm font-medium text-haze" htmlFor="invite-link">
              Link do convite
            </label>
            <Input id="invite-link" readOnly value={link} onFocus={(e) => e.target.select()} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Fechar
              </Button>
              <Button type="button" variant="solid" onClick={() => void copyLink()}>
                {copied ? "Copiado" : "Copiar link"}
              </Button>
            </div>
          </>
        ) : null}
        {!pending && !link && error ? (
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={onClose}>
              Fechar
            </Button>
          </div>
        ) : null}
      </div>
    </AppDialog>
  );
}
