/** Shared getUserMedia / LiveKit mic capture constraints. */
export const MIC_CAPTURE = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  voiceIsolation: true,
  channelCount: 1,
  // Chromium still honors these legacy goog* flags for stronger NS.
  googEchoCancellation: true,
  googNoiseSuppression: true,
  googAutoGainControl: true,
  googHighpassFilter: true,
  googTypingNoiseDetection: true,
  googNoiseSuppression2: true,
} as const;

export const MIC_CAPTURE_FALLBACK = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
  googEchoCancellation: true,
  googNoiseSuppression: true,
  googAutoGainControl: true,
  googHighpassFilter: true,
} as const;
