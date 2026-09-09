import { Gamepad2 } from "lucide-react";
import welcomeBanner from "../../assets/community/welcome-banner.png";
import { cn } from "../../lib/utils.ts";
import { Icon } from "../ui/icon.tsx";

type WelcomeBannerProps = {
  channelName: string;
  className?: string;
};

const TAGS = [
  { label: "Comunidade ativa", className: "bg-electric/20 text-[#c4b5fd]" },
  { label: "Respeito sempre", className: "bg-signal/15 text-signal" },
  { label: "Bora jogar!", className: "bg-blue/20 text-[#93c5fd]" },
] as const;

export function WelcomeBanner({ channelName, className }: WelcomeBannerProps) {
  const label = channelName.replace(/^#\s*/, "").trim() || "geral";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[18px] border border-white/[0.07] bg-deck",
        className,
      )}
    >
      <img
        src={welcomeBanner}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-55"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(8,9,15,0.94)_0%,rgba(8,9,15,0.78)_42%,rgba(8,9,15,0.45)_70%,rgba(124,58,237,0.25)_100%)]"
        aria-hidden
      />
      <div className="relative flex flex-col gap-3 px-5 py-6 sm:px-6 sm:py-7">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-electric/25 text-cloud ring-1 ring-electric/40">
          <Icon icon={Gamepad2} />
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-cloud sm:text-2xl">
            Bem-vindo ao #{label}!
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-haze">
            Este é o começo do canal #{label}! Aqui rola de tudo: conversas, dicas, memes, jogos e
            muito mais.
          </p>
        </div>
        <div className="mt-1 flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <span
              key={tag.label}
              className={cn(
                "control-badge tracking-wide",
                tag.className,
              )}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
