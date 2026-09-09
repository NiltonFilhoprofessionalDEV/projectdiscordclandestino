import { AuthProvider } from "./auth/AuthProvider.tsx";
import { useAuth } from "./auth/useAuth.ts";
import { Button } from "./components/ui/button.tsx";
import { Home } from "./pages/Home.tsx";
import { AuthPage } from "./pages/AuthPage.tsx";

export function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

function AppGate() {
  const { session, user, profile, loading, error, signOut } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-night px-5">
        <p className="text-haze">Carregando sessão…</p>
      </main>
    );
  }

  if (session && error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-night px-5">
        <p className="text-coral" role="alert">
          {error}
        </p>
        <Button type="button" variant="solid" onClick={() => void signOut()}>
          Sair
        </Button>
      </main>
    );
  }

  if (!session || !user || !profile) {
    return <AuthPage />;
  }

  return <Home user={user} profile={profile} />;
}
