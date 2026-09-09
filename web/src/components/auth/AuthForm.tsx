import { useState, type FormEvent } from "react";
import { parseDisplayName } from "../../../../shared/displayName.ts";
import { supabase } from "../../services/supabase.ts";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { GoogleButton } from "./GoogleButton.tsx";

type AuthMode = "signin" | "signup";

function parseEmail(raw: string) {
  const value = raw.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { ok: false as const, error: "Digite um e-mail válido." };
  }
  return { ok: true as const, value };
}

function parsePassword(raw: string) {
  if (raw.length < 6) {
    return { ok: false as const, error: "A senha deve ter pelo menos 6 caracteres." };
  }
  return { ok: true as const, value: raw };
}

function isGoogleUnavailable(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("provider is not enabled") ||
    normalized.includes("unsupported provider")
  );
}

function publicAuthMessage(message: string, mode: AuthMode) {
  const normalized = message.toLowerCase();
  if (isGoogleUnavailable(message)) {
    return "Google não está configurado neste ambiente.";
  }
  if (normalized.includes("invalid login") || normalized.includes("invalid_credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (normalized.includes("already registered") || normalized.includes("user already")) {
    return "Este e-mail já está em uso.";
  }
  return mode === "signup"
    ? "Não foi possível criar a conta. Tente de novo."
    : "Não foi possível entrar. Tente de novo.";
}

function signUpWithEmail(email: string, password: string, displayName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
}

function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const parsedEmail = parseEmail(email);
    if (!parsedEmail.ok) {
      setError(parsedEmail.error);
      return;
    }
    const parsedPassword = parsePassword(password);
    if (!parsedPassword.ok) {
      setError(parsedPassword.error);
      return;
    }

    if (mode === "signup") {
      const parsedName = parseDisplayName(displayName);
      if (!parsedName.ok) {
        setError(parsedName.error);
        return;
      }
      setPending(true);
      const { data, error: signUpError } = await signUpWithEmail(
        parsedEmail.value,
        parsedPassword.value,
        parsedName.value,
      );
      setPending(false);
      if (signUpError) {
        setError(publicAuthMessage(signUpError.message, "signup"));
        return;
      }
      if (!data.session) {
        setNotice("Conta criada. Verifique seu e-mail para entrar.");
      }
      return;
    }

    setPending(true);
    const { error: signInError } = await signInWithEmail(
      parsedEmail.value,
      parsedPassword.value,
    );
    setPending(false);
    if (signInError) {
      setError(publicAuthMessage(signInError.message, "signin"));
    }
  }

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    setPending(true);
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        skipBrowserRedirect: true,
      },
    });
    if (oauthError || !data.url) {
      setPending(false);
      setError(publicAuthMessage(oauthError?.message ?? "Unsupported provider", mode));
      return;
    }

    const probe = await fetch(data.url, { redirect: "manual" });
    if (probe.status === 400 || probe.status === 404 || probe.status === 422) {
      setPending(false);
      setError("Google não está configurado neste ambiente.");
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mt-8">
      {mode === "signup" ? (
        <>
          <label className="block text-sm font-medium text-haze" htmlFor="display-name">
            Como devemos chamar você?
          </label>
          <Input
            id="display-name"
            autoComplete="nickname"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
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
        onChange={(event) => setEmail(event.target.value)}
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
        onChange={(event) => setPassword(event.target.value)}
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
        <GoogleButton disabled={pending} onClick={() => void handleGoogle()} />
      </div>
      <p className="mt-5 text-sm text-haze">
        {mode === "signup" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
        <button
          type="button"
          className="font-semibold text-electric hover:underline"
          onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup" ? "Entrar" : "Criar conta"}
        </button>
      </p>
    </form>
  );
}
