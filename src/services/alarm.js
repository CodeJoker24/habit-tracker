const patterns = {
  chime: { notes: [880, 1108, 1318], step: 0.18, gap: 0.9, type: 'sine' },
  pulse: { notes: [660, 660, 880], step: 0.12, gap: 0.6, type: 'square' },
  bell: { notes: [784, 988, 784, 587], step: 0.22, gap: 1.1, type: 'triangle' },
  beacon: { notes: [523, 0, 523, 0, 784], step: 0.16, gap: 0.8, type: 'sawtooth' },
};

export const soundOptions = Object.keys(patterns);

let context = null;
let master = null;
let active = null;

const getContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!context) {
    context = new AudioContextClass();
    master = context.createGain();
    master.connect(context.destination);
    master.gain.value = 0.6;
  }
  return context;
};

export const unlockAudio = () => {
  const audio = getContext();
  if (audio?.state === 'suspended') audio.resume().catch(() => null);
  return audio?.state === 'running';
};

export const isAudioRunning = () => context?.state === 'running';

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
};

export const notifyCompletion = (title, body) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag: 'habit-tracker-timer', silent: false });
  } catch {
    return null;
  }
};

const emitBurst = (audio, sound) => {
  const pattern = patterns[sound] || patterns.chime;
  const start = audio.currentTime + 0.02;
  pattern.notes.forEach((frequency, index) => {
    if (!frequency) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = pattern.type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + index * pattern.step);
    gain.gain.exponentialRampToValueAtTime(0.7, start + index * pattern.step + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + index * pattern.step + pattern.step * 0.9);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start + index * pattern.step);
    oscillator.stop(start + index * pattern.step + pattern.step);
    active?.oscillators.push(oscillator);
  });
  return pattern.gap;
};

export const stopAlarm = () => {
  if (!active) return;
  window.clearInterval(active.interval);
  active.oscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      return null;
    }
  });
  active = null;
};

export const startAlarm = ({ sound = 'chime', volume = 0.6 } = {}) => {
  stopAlarm();
  const audio = getContext();
  if (!audio) return false;
  audio.resume().catch(() => null);
  master.gain.value = Math.min(1, Math.max(0, Number(volume) || 0));
  active = { interval: null, oscillators: [] };
  const gap = emitBurst(audio, sound);
  active.interval = window.setInterval(() => emitBurst(audio, sound), gap * 1000);
  return audio.state === 'running';
};

export const playTestAlarm = (options) => {
  const running = startAlarm(options);
  window.setTimeout(stopAlarm, 1400);
  return running;
};
