import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import AuthShell from '../../components/AuthShell.jsx';
import Field from '../../components/Field.jsx';
import SubmitButton from '../../components/SubmitButton.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset(email);
      await Swal.fire({
        icon: 'success',
        title: 'Reset link sent',
        text: 'If an account exists for that address, a reset link is on its way.',
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Request failed', text: error.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a link to choose a new password."
      footer={<Link className="text-slate-300 hover:text-slate-200" to="/login">Back to sign in</Link>}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Email" type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        <SubmitButton busy={busy}>Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}
