import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import AuthShell from '../../components/AuthShell.jsx';
import Field from '../../components/Field.jsx';
import PasswordField from '../../components/PasswordField.jsx';
import SubmitButton from '../../components/SubmitButton.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn(form.email, form.password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Sign in failed', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue tracking your progress."
      footer={
        <span>
          New here? <Link className="text-slate-300 hover:text-slate-200" to="/register">Create an account</Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Email" type="email" name="email" value={form.email} onChange={update} autoComplete="email" />
        <PasswordField label="Password" name="password" value={form.password} onChange={update} autoComplete="current-password" />
        <div className="text-right text-sm">
          <Link className="text-slate-300 hover:text-slate-200" to="/forgot-password">Forgot password?</Link>
        </div>
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}
