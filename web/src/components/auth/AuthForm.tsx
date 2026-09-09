import { useState, type FormEvent } from "react";
import { submitEmailAuth, type EmailAuthInput } from "../../auth/emailAuth.ts";
import { startGoogleOAuth } from "../../auth/startGoogleOAuth.ts";
import type { AuthMode } from "../../auth/authMessages.ts";
import { AuthFormFields } from "./AuthFormFields.tsx";

type AuthFeedback = {
  setError: (value: string | null) => void;
  setNotice: (value: string | null) => void;
  setPending: (value: boolean) => void;
};

async function submitWithPending(input: EmailAuthInput, feedback: AuthFeedback) {
  feedback.setError(null);
  feedback.setNotice(null);
  feedback.setPending(true);
  try {
    const result = await submitEmailAuth(input);
    if (!result.ok) {
      feedback.setError(result.error);
      return;
    }
    feedback.setNotice(result.notice);
  } finally {
    feedback.setPending(false);
  }
}

async function googleWithPending(feedback: AuthFeedback) {
  feedback.setError(null);
  feedback.setNotice(null);
  feedback.setPending(true);
  try {
    const googleError = await startGoogleOAuth();
    if (googleError) {
      feedback.setError(googleError);
    }
  } finally {
    feedback.setPending(false);
  }
}

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const feedback = { setError, setNotice, setPending };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submitWithPending({ mode, email, password, displayName }, feedback);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <AuthFormFields
        mode={mode}
        email={email}
        password={password}
        displayName={displayName}
        error={error}
        notice={notice}
        pending={pending}
        onEmail={setEmail}
        onPassword={setPassword}
        onDisplayName={setDisplayName}
        onSwitchMode={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setNotice(null);
        }}
        onGoogle={() => void googleWithPending(feedback)}
      />
    </form>
  );
}
