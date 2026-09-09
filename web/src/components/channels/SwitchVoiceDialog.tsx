import { Button } from "../ui/button.tsx";
import { AppDialog } from "../shell/AppDialog.tsx";

type SwitchVoiceDialogProps = {
  open: boolean;
  fromName: string;
  toName: string;
  onCancel: () => void;
  onAccept: () => void;
};

export function SwitchVoiceDialog({
  open,
  fromName,
  toName,
  onCancel,
  onAccept,
}: SwitchVoiceDialogProps) {
  return (
    <AppDialog
      open={open}
      titleId="switch-voice-dialog-title"
      title="Mudar de sala?"
      description={`Você vai sair de “${fromName}” e entrar em “${toName}”.`}
      onClose={onCancel}
    >
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" variant="primary" onClick={onAccept}>
          Aceitar
        </Button>
      </div>
    </AppDialog>
  );
}
