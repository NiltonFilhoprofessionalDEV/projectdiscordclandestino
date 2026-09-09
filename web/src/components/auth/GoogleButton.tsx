import { Button } from "../ui/button.tsx";

type GoogleButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

export function GoogleButton({ disabled, onClick }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      className="w-full"
      disabled={disabled}
      onClick={onClick}
    >
      Continuar com Google
    </Button>
  );
}
