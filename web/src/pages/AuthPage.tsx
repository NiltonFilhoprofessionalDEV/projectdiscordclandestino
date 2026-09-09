import logoIcon from "../assets/branding/logo-icon.svg";
import authPanel from "../assets/community/auth-gamer-panel.png";
import { AUTH_COPY } from "../components/auth/authCopy.ts";
import { AuthForm } from "../components/auth/AuthForm.tsx";

export function AuthPage() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-[#090a10]">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(80%_60%_at_12%_8%,rgba(124,58,237,0.22),transparent_55%),radial-gradient(70%_50%_at_88%_92%,rgba(6,182,212,0.14),transparent_58%),radial-gradient(50%_40%_at_70%_18%,rgba(236,72,153,0.10),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
        <div className="grid w-full max-w-lg overflow-hidden rounded-[22px] border border-white/10 shadow-[0_0_0_1px_rgba(168,85,247,0.28),0_0_48px_rgba(124,58,237,0.18),0_0_80px_rgba(6,182,212,0.08),0_24px_80px_rgba(0,0,0,0.45)] md:max-w-5xl md:grid-cols-[1.08fr_0.92fr]">
          <div className="bg-[rgba(8,9,16,0.72)] p-5 backdrop-blur-2xl sm:p-10 md:p-12">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="" className="size-10 rounded-xl" />
              <span className="rounded-full border border-[#67e8f9]/35 bg-[#06b6d4]/12 px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-[#67e8f9]">
                {AUTH_COPY.tag}
              </span>
            </div>
            <AuthForm />
          </div>
          <div className="relative hidden min-h-[28rem] border-l border-white/10 md:block" aria-hidden>
            <img src={authPanel} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,15,0.12)_0%,rgba(8,9,15,0.18)_45%,rgba(8,9,15,0.72)_100%)]" />
            <p className="absolute right-8 bottom-8 font-display text-sm font-semibold tracking-wide text-cloud">
              {AUTH_COPY.panelCaption}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
