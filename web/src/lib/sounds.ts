let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const Ctx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) {
    return null;
  }
  if (!audioContext) {
    audioContext = new Ctx();
  }
  return audioContext;
}

function beep(frequency: number, durationMs: number, gain = 0.03) {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  volume.gain.value = gain;
  oscillator.connect(volume);
  volume.connect(ctx.destination);
  const now = ctx.currentTime;
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000);
}

export function playJoinSound() {
  beep(740, 90);
  window.setTimeout(() => beep(980, 90), 80);
}

export function playLeaveSound() {
  beep(620, 110);
  window.setTimeout(() => beep(380, 110), 90);
}

export function playBroadcastOnSound() {
  beep(880, 90);
}

export function playMessageSound() {
  beep(660, 70, 0.04);
  window.setTimeout(() => beep(880, 110, 0.045), 70);
}
