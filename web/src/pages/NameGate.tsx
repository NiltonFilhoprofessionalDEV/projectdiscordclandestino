import { useState, type FormEvent } from "react";
import { parseDisplayName } from "../../../shared/displayName.ts";
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
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="glass w-full max-w-md rounded-[1.75rem] p-8 shadow-glow"
      >
        <p className="font-display text-sm tracking-[0.28em] text-copper uppercase">Salas</p>
        <h1 className="mt-4 font-display text-4xl text-fog">Qual é o seu nome?</h1>
        <p className="mt-2 text-mist">Sem conta. Só um nome para os outros te verem.</p>
        <label className="mt-8 block text-sm text-mist" htmlFor="display-name">
          Digite seu nome
        </label>
        <Input
          id="display-name"
          autoFocus
          autoComplete="nickname"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Nilton"
          className="mt-2 rounded-full"
        />
        {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
        <Button type="submit" variant="solid" size="lg" className="mt-6 w-full">
          Entrar
        </Button>
      </form>
    </main>
  );
}
