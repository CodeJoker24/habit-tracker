import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import Icon from '../components/Icon.jsx';
import PageHeading from '../components/PageHeading.jsx';
import { useAuth } from '../hooks/useAuth.js';
import {
  changeEmail,
  changePassword,
  getProfileOverview,
  getPublicProfile,
  requestAccountDeletion,
  updateProfile,
  uploadAvatar,
} from '../services/profile.js';

const rarityLabel = {
  rare: 'Rare',
  very_rare: 'Very Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const emptyForm = {
  full_name: '',
  username: '',
  bio: '',
  location: '',
  date_of_birth: '',
  visibility: 'private',
  notification_preferences: { badges: true, levels: true, reminders: true },
  favourite_badge_ids: [],
};

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [lookup, setLookup] = useState('');
  const [publicProfile, setPublicProfile] = useState(null);
  const [security, setSecurity] = useState({ password: '', email: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const overview = await getProfileOverview();
      setData(overview);
      const preferences = overview.profile.notification_preferences || {};
      setForm({
        full_name: overview.profile.full_name || '',
        username: overview.profile.username || '',
        bio: overview.profile.bio || '',
        location: overview.profile.location || '',
        date_of_birth: overview.profile.date_of_birth || '',
        visibility: overview.profile.visibility || 'private',
        notification_preferences: {
          badges: preferences.badges ?? true,
          levels: preferences.levels ?? true,
          reminders: preferences.reminders ?? true,
        },
        favourite_badge_ids: overview.profile.favourite_badge_ids || [],
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not load your profile', text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleBadges = useMemo(() => {
    if (!data) return [];
    if (filter === 'earned') return data.badges.filter((badge) => badge.earned);
    if (filter === 'locked') return data.badges.filter((badge) => !badge.earned);
    if (rarityLabel[filter]) return data.badges.filter((badge) => badge.rarity === filter);
    return data.badges;
  }, [data, filter]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      await refreshProfile();
      await load();
      Swal.fire({ icon: 'success', title: 'Profile saved', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not save profile', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    try {
      await uploadAvatar(file);
      await refreshProfile();
      await load();
      Swal.fire({ icon: 'success', title: 'Profile photo updated', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not update photo', text: error.message });
    } finally {
      setAvatarBusy(false);
      event.target.value = '';
    }
  };

  const toggleFavourite = (badgeId) => {
    setForm((current) => {
      const ids = current.favourite_badge_ids || [];
      if (ids.includes(badgeId)) return { ...current, favourite_badge_ids: ids.filter((id) => id !== badgeId) };
      if (ids.length >= 6) {
        Swal.fire({ icon: 'info', title: 'Six badges maximum', text: 'Remove one before adding another.' });
        return current;
      }
      return { ...current, favourite_badge_ids: [...ids, badgeId] };
    });
  };

  const searchPublic = async (event) => {
    event.preventDefault();
    if (!lookup.trim()) return;
    try {
      setPublicProfile(await getPublicProfile(lookup.trim()));
    } catch (error) {
      setPublicProfile(null);
      Swal.fire({ icon: 'error', title: 'Profile not found', text: error.message });
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    if (security.password.length < 8) {
      Swal.fire({ icon: 'error', title: 'Password too short', text: 'Use at least 8 characters.' });
      return;
    }
    try {
      await changePassword(security.password);
      setSecurity((current) => ({ ...current, password: '' }));
      Swal.fire({ icon: 'success', title: 'Password updated', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not change password', text: error.message });
    }
  };

  const handleEmail = async (event) => {
    event.preventDefault();
    try {
      await changeEmail(security.email);
      setSecurity((current) => ({ ...current, email: '' }));
      Swal.fire({
        icon: 'success',
        title: 'Check your new email',
        text: 'Confirm the change through the link Supabase sends you.',
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not change email', text: error.message });
    }
  };

  const handleDeletion = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Request account deletion?',
      text: 'An administrator must complete the deletion. Your data stays intact until then.',
      showCancelButton: true,
      confirmButtonText: 'Send request',
    });
    if (!result.isConfirmed) return;
    try {
      await requestAccountDeletion();
      Swal.fire({ icon: 'success', title: 'Request recorded', timer: 1500, showConfirmButton: false });
      load();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Could not record request', text: error.message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!data) return <p className="text-sm text-slate-300">Profile unavailable.</p>;

  const stats = data.stats;
  const statCards = [
    { label: 'Badges earned', value: `${data.earnedCount}/${data.badges.length}` },
    { label: 'Rare', value: data.rarityCounts.rare },
    { label: 'Very rare', value: data.rarityCounts.very_rare },
    { label: 'Epic', value: data.rarityCounts.epic },
    { label: 'Legendary', value: data.rarityCounts.legendary },
    { label: 'Total XP', value: stats.xp },
    { label: 'Level', value: stats.level },
    { label: 'Current streak', value: `${stats.current_streak} days` },
    { label: 'Longest streak', value: `${stats.longest_streak} days` },
    { label: 'Tasks completed', value: stats.total_tasks_completed },
    { label: 'Habit check-ins', value: stats.total_habit_completions },
    { label: 'Focus minutes', value: stats.total_focus_minutes },
  ];

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Your identity"
        title="Profile"
        description="Your achievements, your story and the settings that control them."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{card.value ?? 0}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">Personal information</h2>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-white">
              {data?.profile?.avatar_url ? (
                <img src={data.profile.avatar_url} alt="Your avatar" className="h-full w-full object-cover" />
              ) : (
                <Icon name="user" size={22} />
              )}
            </span>
            <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10">
              {avatarBusy ? 'Uploading…' : 'Change photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={avatarBusy} />
            </label>
          </div>
          <div>
            <label htmlFor="full_name" className="text-xs uppercase tracking-wider text-slate-400">Full name</label>
            <input
              id="full_name"
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
            />
          </div>
          <div>
            <label htmlFor="username" className="text-xs uppercase tracking-wider text-slate-400">Username</label>
            <input
              id="username"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              placeholder="3–30 letters, numbers or underscores"
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
            />
          </div>
          <div>
            <label htmlFor="bio" className="text-xs uppercase tracking-wider text-slate-400">Bio</label>
            <textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="location" className="text-xs uppercase tracking-wider text-slate-400">Location</label>
              <input
                id="location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
              />
            </div>
            <div>
              <label htmlFor="dob" className="text-xs uppercase tracking-wider text-slate-400">Date of birth</label>
              <input
                id="dob"
                type="date"
                value={form.date_of_birth}
                onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
              />
            </div>
          </div>
          <div>
            <label htmlFor="visibility" className="text-xs uppercase tracking-wider text-slate-400">Profile visibility</label>
            <select
              id="visibility"
              value={form.visibility}
              onChange={(event) => setForm({ ...form, visibility: event.target.value })}
              className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-slate-400">Notifications</p>
            {['badges', 'levels', 'reminders'].map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.notification_preferences[key]}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notification_preferences: {
                        ...form.notification_preferences,
                        [key]: event.target.checked,
                      },
                    })
                  }
                  className="accent-egyptian-600"
                />
                {key === 'badges' ? 'Badge unlocks' : key === 'levels' ? 'Level ups' : 'Reminders'}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-scarlet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-scarlet-500 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          <p className="text-xs text-slate-500">Joined {new Date(data.profile.created_at).toLocaleDateString()} · {user?.email}</p>
        </form>

        <section className="space-y-4">
          <div className="rounded-2xl border border-egyptian-400/30 bg-gradient-to-br from-egyptian-600/30 to-slate-900 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-300">Live preview</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white/10 text-white">
                {data?.profile?.avatar_url ? (
                  <img src={data.profile.avatar_url} alt="Your avatar" className="h-full w-full object-cover" />
                ) : (
                  <Icon name="user" size={22} />
                )}
              </span>
              <div>
                <p className="font-semibold text-white">{form.full_name || form.username || 'Your name'}</p>
                <p className="text-xs text-slate-300">@{form.username || 'username'}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-200">{form.bio || 'Your bio will appear here.'}</p>
            <p className="mt-2 text-xs text-slate-400">{form.location || 'No location'}</p>
            <p className="mt-4 text-xs text-slate-400">
              {form.visibility === 'public' ? 'Visible to signed-in members' : 'Only visible to you and admins'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.favourites.filter((badge) => badge.earned).map((badge) => (
                <span key={badge.id} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                  {badge.name}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={searchPublic} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">View a public profile</h2>
            <div className="mt-3 flex gap-2">
              <input
                value={lookup}
                onChange={(event) => setLookup(event.target.value)}
                placeholder="Username"
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
              />
              <button type="submit" className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-400">
                View
              </button>
            </div>
            {publicProfile ? (
              <div className="mt-4 rounded-xl bg-slate-900/70 p-4 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                  {publicProfile.avatarUrl ? (
                    <img src={publicProfile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : null}
                  <p className="font-semibold text-white">{publicProfile.fullName}</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">@{publicProfile.username} · {publicProfile.bio || 'No bio'}</p>
                <p className="mt-2 text-xs">
                  Level {publicProfile.stats.level} · {publicProfile.badgeCount} badges · {publicProfile.stats.currentStreak} day streak
                </p>
                {publicProfile.showcase.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {publicProfile.showcase.map((badge) => (
                      <span key={badge.code} className="rounded-full bg-egyptian-600/30 px-2 py-1 text-[11px] text-white">
                        {badge.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Collection</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Badge showcase</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'earned', 'locked', ...Object.keys(rarityLabel)].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  filter === key ? 'bg-egyptian-600 text-white' : 'border border-white/15 text-slate-300 hover:bg-white/10'
                }`}
              >
                {rarityLabel[key] || key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">Select up to six earned badges to showcase on your public profile.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleBadges.slice(0, 80).map((badge) => {
            const favourite = (form.favourite_badge_ids || []).includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-xl border p-4 ${badge.earned ? 'border-egyptian-400/40 bg-egyptian-600/10' : 'border-white/10 bg-white/5 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon name={badge.icon} size={20} className={badge.earned ? 'text-egyptian-400' : 'text-slate-400'} />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">{rarityLabel[badge.rarity]}</span>
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-white">{badge.name}</p>
                <p className="mt-1 text-xs text-slate-300">{badge.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">+{badge.xp_reward} XP</span>
                  {badge.earned ? (
                    <button
                      type="button"
                      onClick={() => toggleFavourite(badge.id)}
                      className={`text-[11px] font-medium ${favourite ? 'text-scarlet-200' : 'text-slate-300 hover:text-white'}`}
                    >
                      {favourite ? 'Remove' : 'Showcase'}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        {visibleBadges.length > 80 ? (
          <p className="mt-4 text-xs text-slate-500">Showing 80 of {visibleBadges.length} badges. Use the filters to narrow the collection.</p>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">Account security</h2>
          <form onSubmit={handlePassword} className="space-y-2">
            <label htmlFor="new-password" className="text-xs uppercase tracking-wider text-slate-400">New password</label>
            <input
              id="new-password"
              type="password"
              value={security.password}
              onChange={(event) => setSecurity({ ...security, password: event.target.value })}
              className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
            />
            <button type="submit" className="rounded-lg bg-egyptian-600 px-4 py-2 text-sm font-semibold text-white hover:bg-egyptian-500">
              Change password
            </button>
          </form>
          <form onSubmit={handleEmail} className="space-y-2">
            <label htmlFor="new-email" className="text-xs uppercase tracking-wider text-slate-400">New email</label>
            <input
              id="new-email"
              type="email"
              value={security.email}
              onChange={(event) => setSecurity({ ...security, email: event.target.value })}
              className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-egyptian-400"
            />
            <button type="submit" className="rounded-lg bg-egyptian-600 px-4 py-2 text-sm font-semibold text-white hover:bg-egyptian-500">
              Update email
            </button>
          </form>
        </div>
        <div className="rounded-2xl border border-scarlet-600/30 bg-scarlet-600/5 p-5">
          <h2 className="text-lg font-semibold text-white">Danger zone</h2>
          <p className="mt-2 text-sm text-slate-300">
            Request account deletion. An administrator must complete it after review.
          </p>
          {data.profile.account_deletion_requested_at ? (
            <p className="mt-3 text-xs text-scarlet-200">
              Request sent {new Date(data.profile.account_deletion_requested_at).toLocaleString()}.
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleDeletion}
            className="mt-4 rounded-lg bg-scarlet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-scarlet-500"
          >
            Request account deletion
          </button>
        </div>
      </section>
    </div>
  );
}
