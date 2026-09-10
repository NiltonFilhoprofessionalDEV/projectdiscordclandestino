import { AuthProvider } from "./auth/AuthProvider.tsx";
import { useAuth } from "./auth/useAuth.ts";
import { Button } from "./components/ui/button.tsx";
import { Loading } from "./components/ui/loading.tsx";
import { captureInviteFromLocation } from "./invites/path.ts";
import { Home } from "./pages/Home.tsx";
import { AuthPage } from "./pages/AuthPage.tsx";
import { supabaseConfigError } from "./services/supabase.ts";

captureInviteFromLocation();

export function App() {
  if (supabaseConfigError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-night px-5">
        <p className="max-w-lg text-center text-coral" role="alert">
          {supabaseConfigError}
        </p>
      </main>
    );
  }

  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

function AppGate() {
  const { session, user, profile, loading, error, signOut } = useAuth();

  // If we already have a usable session, never blank the app on soft auth
  // events (token refresh when returning from another tab/app).
  if (loading && !(session && user && profile)) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-night px-5">
        <Loading label="Carregando sessão…" />
      </main>
    );
  }

  if (session && error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-night px-5">
        <p className="text-coral" role="alert">
          {error}
        </p>
        <Button type="button" variant="primary" onClick={() => void signOut()}>
          Sair
        </Button>
      </main>
    );
  }

  if (!session && error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-night px-5">
        <p className="max-w-md text-center text-coral" role="alert">
          {error}
        </p>
        <Button type="button" variant="primary" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </main>
    );
  }

  if (!session || !user || !profile) {
    return <AuthPage />;
  }

  return <Home user={user} profile={profile} />;
}
