/** Nickname color: coral = hard mute, blue = VAD mode, cloud = open mic. */
export function voiceNameClass(micOn: boolean, voiceActivityOn: boolean): string {
  if (!micOn) {
    return "text-coral";
  }
  if (voiceActivityOn) {
    return "text-blue";
  }
  return "text-cloud";
}

/**
 * No VAD: mic icon follows hard mute.
 * Com VAD: ícone mutado no silêncio e aberto ao falar — nick permanece azul.
 */
export function voiceMicOpen(
  micOn: boolean,
  voiceActivityOn: boolean,
  speaking: boolean,
): boolean {
  if (!micOn) {
    return false;
  }
  if (voiceActivityOn) {
    return speaking;
  }
  return true;
}

export function voiceMicIconClass(micOn: boolean, voiceActivityOn: boolean): string {
  if (!micOn) {
    return "text-coral";
  }
  if (voiceActivityOn) {
    return "text-blue";
  }
  return "text-haze";
}
