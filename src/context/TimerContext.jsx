import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import {
  isAudioRunning,
  notifyCompletion,
  requestNotificationPermission,
  startAlarm,
  stopAlarm,
  unlockAudio,
} from '../services/alarm.js';
import { requestBackgroundSync } from '../services/pwa.js';
import { enqueue } from '../services/syncService.js';
import { saveSession } from '../services/timer.js';

const STORAGE_KEY = 'habit-tracker-timer';
const DEFAULT_DURATION = 25;

export const TimerContext = createContext(null);

const initialState = {
  duration: DEFAULT_DURATION,
  remaining: DEFAULT_DURATION * 60,
  running: false,
  endAt: null,
  startedAt: null,
  saved: true,
  sound: 'chime',
  volume: 0.6,
  alarmActive: false,
};

const loadState = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return initialState;
    const state = { ...initialState, ...stored };
    if (state.running && state.endAt) {
      const remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
      const ended = remaining === 0;
      return {
        ...state,
        remaining,
        running: !ended,
        endAt: ended ? null : state.endAt,
        alarmActive: ended ? !state.saved : false,
      };
    }
    return { ...state, alarmActive: state.remaining === 0 && !state.saved };
  } catch {
    return initialState;
  }
};

export function TimerProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(loadState);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [soundRetry, setSoundRetry] = useState(0);
  const saving = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.running) return undefined;
    const interval = setInterval(() => {
      setState((current) => {
        if (!current.running || !current.endAt) return current;
        const remaining = Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000));
        if (remaining === current.remaining) return current;
        const ended = remaining === 0;
        return {
          ...current,
          remaining,
          running: !ended,
          endAt: ended ? null : current.endAt,
          alarmActive: ended && !current.saved ? true : current.alarmActive,
        };
      });
    }, 500);
    return () => clearInterval(interval);
  }, [state.running]);

  useEffect(() => {
    if (!state.alarmActive) {
      stopAlarm();
      return undefined;
    }
    const running = startAlarm({ sound: state.sound, volume: state.volume });
    setSoundBlocked(!running);
    notifyCompletion('Focus session complete', `${state.duration} minutes of deep work finished.`);
    return () => stopAlarm();
  }, [state.alarmActive, state.duration, state.sound, state.volume, soundRetry]);

  useEffect(() => {
    if (state.remaining !== 0 || state.saved || saving.current) return;
    saving.current = true;
    const elapsed = state.duration * 60 - state.remaining;
    const startedAt = state.startedAt || new Date(Date.now() - elapsed * 1000).toISOString();
    const values = {
      duration_minutes: state.duration,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
    };
    const operationId = crypto.randomUUID();
    const targetId = crypto.randomUUID();
    const queued = {
      operationId,
      userId: user?.id,
      type: 'timer.session',
      targetId,
      payload: values,
      localRecord: { id: targetId, ...values },
      createdAt: new Date().toISOString(),
      status: 'pending',
      retries: 0,
      nextAttemptAt: 0,
    };
    const queue = async () => {
      await enqueue(queued);
      requestBackgroundSync();
    };
    const persist = async () => {
      if (navigator.onLine === false || !user?.id) {
        await queue();
        return;
      }
      try {
        await saveSession(values, { 'X-Operation-Id': operationId });
      } catch (error) {
        if (!error.status || error.status >= 500) await queue();
      }
    };

    persist()
      .catch(() => null)
      .finally(() => {
        setState((current) => ({ ...current, saved: true, startedAt: null }));
        saving.current = false;
      });
  }, [state.remaining, state.saved, state.duration, state.startedAt, user?.id]);

  const setDuration = useCallback((minutes) => {
    const duration = Math.min(240, Math.max(1, Number(minutes) || DEFAULT_DURATION));
    stopAlarm();
    setState((current) => ({
      ...initialState,
      duration,
      remaining: duration * 60,
      sound: current.sound,
      volume: current.volume,
    }));
  }, []);

  const setSound = useCallback((sound) => {
    setState((current) => ({ ...current, sound }));
  }, []);

  const setVolume = useCallback((volume) => {
    setState((current) => ({ ...current, volume: Math.min(1, Math.max(0, Number(volume) || 0)) }));
  }, []);

  const start = useCallback(() => {
    unlockAudio();
    requestNotificationPermission();
    stopAlarm();
    setState((current) => {
      const remaining = current.remaining > 0 ? current.remaining : current.duration * 60;
      const elapsed = current.duration * 60 - remaining;
      const freshSession = current.remaining === 0;
      return {
        ...current,
        remaining,
        running: true,
        alarmActive: false,
        endAt: Date.now() + remaining * 1000,
        startedAt: freshSession
          ? new Date().toISOString()
          : current.startedAt || new Date(Date.now() - elapsed * 1000).toISOString(),
        saved: false,
      };
    });
  }, []);

  const pause = useCallback(() => {
    setState((current) => {
      const remaining = current.running && current.endAt
        ? Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000))
        : current.remaining;
      return { ...current, remaining, running: false, endAt: null, saved: true, alarmActive: false };
    });
    stopAlarm();
  }, []);

  const reset = useCallback(() => {
    stopAlarm();
    setState((current) => ({
      ...current,
      remaining: current.duration * 60,
      running: false,
      endAt: null,
      startedAt: null,
      saved: true,
      alarmActive: false,
    }));
  }, []);

  const stopAlarmNow = useCallback(() => {
    stopAlarm();
    setSoundBlocked(false);
    setState((current) => ({ ...current, alarmActive: false }));
  }, []);

  const enableSound = useCallback(() => {
    unlockAudio();
    setSoundBlocked(!isAudioRunning());
    setSoundRetry((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      soundBlocked,
      setDuration,
      setSound,
      setVolume,
      start,
      pause,
      reset,
      stopAlarm: stopAlarmNow,
      enableSound,
    }),
    [state, soundBlocked, setDuration, setSound, setVolume, start, pause, reset, stopAlarmNow, enableSound],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
