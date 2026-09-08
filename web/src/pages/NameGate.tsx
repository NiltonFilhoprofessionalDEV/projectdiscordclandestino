import { useState, type FormEvent } from "react";
import { parseDisplayName } from "../../../shared/displayName.ts";
import { PulseLine } from "../components/shell/PulseLine.tsx";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";

type NameGateProps = {
  onSubmit: (name: string) => void;
};

export function NameGate({ onSubmit }: NameGateProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseDisplayName(value);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    onSubmit(parsed.value);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-night px-5 py-8 sm:px-8">
      <form
        onSubmit={handleSubmit}
        className="surface-raised grid w-full max-w-4xl overflow-hidden rounded-[1.75rem] md:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="p-7 sm:p-10 md:p-12">
          <p className="text-sm font-semibold tracking-[0.16em] text-electric uppercase">
            Salas
          </p>
          <h1 className="mt-5 font-display text-4xl leading-tight text-cloud sm:text-5xl">
            Entre. Fale. Fique à vontade.
          </h1>
          <p className="mt-4 max-w-md leading-relaxed text-haze">
            Escolha um nome para entrar nas salas. Sem cadastro.
          </p>
          <label className="mt-8 block text-sm font-medium text-haze" htmlFor="display-name">
            Como devemos chamar você?
          </label>
          <Input
            id="display-name"
            autoFocus
            autoComplete="nickname"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Seu nome"
            className="mt-2"
            aria-describedby={error ? "display-name-error" : undefined}
          />
          {error ? (
            <p id="display-name-error" className="mt-2 text-sm text-coral">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="solid" size="lg" className="mt-6 w-full">
            Entrar nas salas
          </Button>
        </div>
        <div
          className="relative hidden min-h-[32rem] overflow-hidden border-l border-haze/10 bg-abyss md:block"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(138,77,255,0.26),transparent_40%)]" />
          <span className="absolute top-20 right-12 h-36 w-32 rotate-6 rounded-[2rem] bg-pulse/22 ring-1 ring-pulse/30" />
          <span className="absolute top-48 left-10 h-28 w-36 -rotate-6 rounded-[1.7rem] bg-electric/18 ring-1 ring-electric/28" />
          <span className="absolute right-16 bottom-20 size-24 rotate-3 rounded-[1.5rem] bg-coral/18 ring-1 ring-coral/25" />
          <PulseLine active className="absolute top-1/2 left-8 w-[calc(100%-4rem)]" />
          <p className="absolute right-10 bottom-8 font-display text-sm text-haze">
            Sua conversa começa aqui.
          </p>
        </div>
      </form>
    </main>
  );
}
