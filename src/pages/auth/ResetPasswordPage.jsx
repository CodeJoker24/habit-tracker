import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import AuthShell from '../../components/AuthShell.jsx';
import PasswordField from '../../components/PasswordField.jsx';
import SubmitButton from '../../components/SubmitButton.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { supabase } from '../../services/supabase.js';

export default function ResetPasswordPage() {
  const { resetPassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const query = window.location.hash.slice(1) || window.location.search.slice(1);
    const params = new URLSearchParams(query);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) return;

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (!error) setReady(true);
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await resetPassword(password);
      await signOut();
      await Swal.fire({ icon: 'success', title: 'Password updated', text: 'Sign in with your new password.' });
      navigate('/login', { replace: true });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Reset failed', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <AuthShell title="Invalid reset link" subtitle="This link is missing or has expired.">
        <Link className="text-slate-300 hover:text-slate-200" to="/forgot-password">Request a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least eight characters.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <PasswordField label="New password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} />
        <SubmitButton busy={busy}>Update password</SubmitButton>
      </form>
    </AuthShell>
  );
}
