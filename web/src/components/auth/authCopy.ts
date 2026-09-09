import type { AuthMode } from "../../auth/authMessages.ts";

export const AUTH_COPY = {
  tag: "COMUNIDADE",
  panelCaption: "Setup ligado. Call no ar.",
  google: "Entrar com Google",
  fields: {
    nickLabel: "Seu nick na cria",
    nickPlaceholder: "como a galera te chama",
    emailLabel: "E-mail",
    emailPlaceholder: "o e-mail que você usa",
    passwordLabel: "Senha",
    passwordPlaceholder: "pelo menos 6 caracteres",
  },
  signin: {
    title: "Cai na call com a cria.",
    subtitle: "Entre com e-mail ou Google.",
    submit: "Entrar na cria",
    switchPrompt: "Primeira vez por aqui?",
    switchAction: "Criar conta",
  },
  signup: {
    title: "Chega. Escolhe teu nick.",
    subtitle: "Nick, e-mail e senha.",
    submit: "Criar minha conta",
    switchPrompt: "Já faz parte da cria?",
    switchAction: "Entrar",
  },
} as const;

export function authScreenCopy(mode: AuthMode) {
  return mode === "signup" ? AUTH_COPY.signup : AUTH_COPY.signin;
}
