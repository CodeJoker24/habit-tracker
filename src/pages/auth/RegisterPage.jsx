import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import AuthShell from '../../components/AuthShell.jsx';
import Field from '../../components/Field.jsx';
import PasswordField from '../../components/PasswordField.jsx';
import SubmitButton from '../../components/SubmitButton.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await signUp(form);
      if (result.needsConfirmation) {
        await Swal.fire({
          icon: 'info',
          title: 'Check your email',
          text: 'Confirm your email address before signing in.',
        });
        navigate('/login', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Registration failed', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building better habits today."
      footer={
        <span>
          Already registered? <Link className="text-slate-300 hover:text-slate-200" to="/login">Sign in</Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Full name" name="fullName" value={form.fullName} onChange={update} autoComplete="name" />
        <Field label="Email" type="email" name="email" value={form.email} onChange={update} autoComplete="email" />
        <PasswordField label="Password" name="password" value={form.password} onChange={update} autoComplete="new-password" minLength={8} />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}
