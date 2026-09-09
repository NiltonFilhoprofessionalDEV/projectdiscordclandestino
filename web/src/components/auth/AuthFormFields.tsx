import type { AuthMode } from "../../auth/authMessages.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { AUTH_COPY, authScreenCopy } from "./authCopy.ts";
import { GoogleButton } from "./GoogleButton.tsx";

const AUTH_INPUT =
  "mt-2 border-white/10 bg-[#08090f]/80 focus:border-[#a855f7]/70 focus:shadow-[0_0_24px_rgba(124,58,237,0.22)] focus:ring-[#06b6d4]/30";

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
  const copy = authScreenCopy(mode);
  const fields = AUTH_COPY.fields;

  return (
    <>
      {mode === "signup" ? (
        <>
          <label className="block text-sm font-medium text-haze" htmlFor="display-name">
            {fields.nickLabel}
          </label>
          <Input
            id="display-name"
            autoComplete="nickname"
            value={displayName}
            onChange={(event) => onDisplayName(event.target.value)}
            placeholder={fields.nickPlaceholder}
            className={AUTH_INPUT}
          />
        </>
      ) : null}
      <label
        className={`block text-sm font-medium text-haze ${mode === "signup" ? "mt-4" : ""}`}
        htmlFor="email"
      >
        {fields.emailLabel}
      </label>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(event) => onEmail(event.target.value)}
        placeholder={fields.emailPlaceholder}
        className={AUTH_INPUT}
      />
      <label className="mt-4 block text-sm font-medium text-haze" htmlFor="password">
        {fields.passwordLabel}
      </label>
      <Input
        id="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(event) => onPassword(event.target.value)}
        placeholder={fields.passwordPlaceholder}
        className={AUTH_INPUT}
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
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-6 w-full shadow-[0_10px_36px_rgba(236,72,153,0.38)]"
        disabled={pending}
      >
        {copy.submit}
      </Button>
      <div className="mt-3">
        <GoogleButton disabled={pending} onClick={onGoogle} />
      </div>
      <p className="mt-5 text-sm text-haze">
        {copy.switchPrompt}{" "}
        <button
          type="button"
          className="font-semibold text-electric transition duration-150 ease-out hover:text-[#A78BFA]"
          onClick={onSwitchMode}
        >
          {copy.switchAction}
        </button>
      </p>
    </>
  );
}
