import { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import PageHeading from '../components/PageHeading.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useTimer } from '../hooks/useTimer.js';
import { playTestAlarm, soundOptions } from '../services/alarm.js';
import { getRecords, putRecords } from '../services/offlineStore.js';
import { getSessions } from '../services/timer.js';

const presets = [15, 25, 50];

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export default function TimerPage() {
  const { user } = useAuth();
  const timer = useTimer();
  const [sessions, setSessions] = useState([]);
  const [customMinutes, setCustomMinutes] = useState(String(timer.duration));
  const wasSaved = useRef(timer.saved);

  const loadSessions = useCallback(async () => {
    try {
      const rows = await getSessions();
      setSessions(rows);
      if (user?.id) await putRecords(user.id, 'sessions', rows).catch(() => null);
    } catch (error) {
      const cached = user?.id ? await getRecords(user.id, 'sessions').catch(() => []) : [];
      setSessions(cached);
      if (navigator.onLine) Swal.fire({ icon: 'error', title: 'Could not load focus sessions', text: error.message });
    }
  }, [user?.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (timer.saved && !wasSaved.current) loadSessions();
    wasSaved.current = timer.saved;
  }, [loadSessions, timer.saved]);

  useEffect(() => {
    setCustomMinutes(String(timer.duration));
  }, [timer.duration]);

  const progress = timer.duration ? Math.round(((timer.duration * 60 - timer.remaining) / (timer.duration * 60)) * 100) : 0;
  const totalMinutes = sessions.reduce((total, session) => total + session.duration_minutes, 0);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Deep work"
        title="Focus timer"
        description="Stay with one thing until the timer ends. The session is saved automatically."
      />

      {timer.alarmActive ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-scarlet-500/50 bg-scarlet-600/20 p-5 shadow-lg shadow-scarlet-600/30">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Session complete</p>
            <p className="mt-1 text-xl font-semibold text-white">Time is up — well done.</p>
            {timer.soundBlocked ? (
              <p className="mt-1 text-xs text-slate-200">Your browser blocked audio. Tap “Enable sound”.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {timer.soundBlocked ? (
              <button
                type="button"
                onClick={timer.enableSound}
                className="rounded-lg bg-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/25"
              >
                Enable sound
              </button>
            ) : null}
            <button
              type="button"
              onClick={timer.stopAlarm}
              className="rounded-lg bg-scarlet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-scarlet-500"
            >
              Stop Alarm
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Session length</p>
          <div className="mt-4 flex justify-center gap-2">
            {presets.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => timer.setDuration(minutes)}
                className={`rounded-lg px-4 py-2 text-sm ${
                  timer.duration === minutes ? 'bg-egyptian-600 text-white' : 'border border-white/15 text-slate-400 hover:text-white'
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
          <form
            className="mx-auto mt-5 flex max-w-xs items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              timer.setDuration(Number(customMinutes));
            }}
          >
            <label className="sr-only" htmlFor="custom-duration">Custom timer length in minutes</label>
            <input
              id="custom-duration"
              type="number"
              min="1"
              max="240"
              value={customMinutes}
              onChange={(event) => setCustomMinutes(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-center text-sm text-white outline-none focus:border-egyptian-400"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-400"
            >
              Set
            </button>
          </form>

          <p className="mt-7 font-mono text-6xl tabular-nums text-white sm:text-7xl">{formatTime(timer.remaining)}</p>
          <div className="mx-auto mt-6 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-egyptian-400 transition-all" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
          <div className="mx-auto mt-6 grid max-w-md gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="alarm-sound" className="text-xs uppercase tracking-wider text-slate-300">Alarm sound</label>
              <select
                id="alarm-sound"
                value={timer.sound}
                onChange={(event) => timer.setSound(event.target.value)}
                className="rounded-lg border border-white/15 bg-slate-900 px-3 py-1.5 text-sm text-white"
              >
                {soundOptions.map((sound) => (
                  <option key={sound} value={sound}>{sound.charAt(0).toUpperCase() + sound.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="alarm-volume" className="text-xs uppercase tracking-wider text-slate-300">Volume</label>
              <input
                id="alarm-volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={timer.volume}
                onChange={(event) => timer.setVolume(event.target.value)}
                className="flex-1 accent-egyptian-400"
              />
              <span className="w-10 text-right text-xs text-slate-300">{Math.round(timer.volume * 100)}%</span>
            </div>
            <button
              type="button"
              onClick={() => playTestAlarm({ sound: timer.sound, volume: timer.volume })}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              Test alarm
            </button>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            {timer.running ? (
              <button
                type="button"
                onClick={timer.pause}
                className="rounded-lg bg-slate-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-400"
              >
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={timer.start}
                className="rounded-lg bg-scarlet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-scarlet-500"
              >
                Start
              </button>
            )}
            <button
              type="button"
              onClick={timer.reset}
              className="rounded-lg border border-white/15 px-6 py-2.5 text-sm text-slate-300 hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Recent sessions</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totalMinutes} minutes focused</p>
          <div className="mt-5 space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400">No sessions yet. Start the timer above.</p>
            ) : (
              sessions.slice(0, 8).map((session) => (
                <div key={session.id} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-slate-400">{new Date(session.ended_at).toLocaleDateString()}</span>
                  <span className="text-white">{session.duration_minutes} min</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
