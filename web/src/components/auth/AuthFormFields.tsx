import type { AuthMode } from "../../auth/authMessages.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { GoogleButton } from "./GoogleButton.tsx";

type AuthFormFieldsProps = {
  mode: AuthMode;
  email: string;
  password: string;
  displayName: string;
  error: string | null;
  notice: string | null;
  pending: boolean;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onDisplayName: (value: string) => void;
  onSwitchMode: () => void;
  onGoogle: () => void;
};

export function AuthFormFields({
  mode,
  email,
  password,
  displayName,
  error,
  notice,
  pending,
  onEmail,
  onPassword,
  onDisplayName,
  onSwitchMode,
  onGoogle,
}: AuthFormFieldsProps) {
  return (
    <>
      {mode === "signup" ? (
        <>
          <label className="block text-sm font-medium text-haze" htmlFor="display-name">
            Como devemos chamar você?
          </label>
          <Input
            id="display-name"
            autoComplete="nickname"
            value={displayName}
            onChange={(event) => onDisplayName(event.target.value)}
            placeholder="Seu nome"
            className="mt-2"
          />
        </>
      ) : null}
      <label
        className={`block text-sm font-medium text-haze ${mode === "signup" ? "mt-4" : ""}`}
        htmlFor="email"
      >
        E-mail
      </label>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(event) => onEmail(event.target.value)}
        placeholder="voce@email.com"
        className="mt-2"
      />
      <label className="mt-4 block text-sm font-medium text-haze" htmlFor="password">
        Senha
      </label>
      <Input
        id="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(event) => onPassword(event.target.value)}
        placeholder="Mínimo de 6 caracteres"
        className="mt-2"
      />
      {error ? (
        <p id="auth-error" className="mt-2 text-sm text-coral" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-2 text-sm text-electric" role="status">
          {notice}
        </p>
      ) : null}
      <Button type="submit" variant="solid" size="lg" className="mt-6 w-full" disabled={pending}>
        {mode === "signup" ? "Criar conta" : "Entrar"}
      </Button>
      <div className="mt-3">
        <GoogleButton disabled={pending} onClick={onGoogle} />
      </div>
      <p className="mt-5 text-sm text-haze">
        {mode === "signup" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
        <button
          type="button"
          className="font-semibold text-electric hover:underline"
          onClick={onSwitchMode}
        >
          {mode === "signup" ? "Entrar" : "Criar conta"}
        </button>
      </p>
    </>
  );
}
