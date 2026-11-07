import { useState } from 'react';

export default function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const endpoint = isRegistering ? 'register' : 'login';
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Authentication failed.');
      setSession(result);
      setPassword('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode() {
    setIsRegistering((current) => !current);
    setError('');
  }

  return (
    <main className="page-shell">
      <section className="auth-card" aria-labelledby="page-title">
        <div className="brand-mark" aria-hidden="true">✓</div>
        {session ? (
          <div className="success-panel" role="status">
            <p className="eyebrow">YOU’RE SIGNED IN</p>
            <h1 id="page-title">Welcome back.</h1>
            <p className="subtitle">Your session is ready for {session.user.email}.</p>
            <button className="primary-button" type="button" onClick={() => setSession(null)}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow">A CLEARER WAY TO GET THINGS DONE</p>
            <h1 id="page-title">{isRegistering ? 'Create your account' : 'Welcome back.'}</h1>
            <p className="subtitle">
              {isRegistering ? 'Start with your email and a secure password.' : 'Sign in to pick up where you left off.'}
            </p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                required
              />
              {error && <p className="error-message" role="alert">{error}</p>}
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait…' : isRegistering ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <p className="switch-mode">
              {isRegistering ? 'Already have an account?' : 'New to Todo?'}{' '}
              <button type="button" onClick={switchMode}>
                {isRegistering ? 'Sign in' : 'Create an account'}
              </button>
            </p>
            <p className="security-note">Your password is securely hashed before it is stored.</p>
          </>
        )}
      </section>
      <footer>FOCUS ON WHAT MATTERS <span>·</span> ONE TASK AT A TIME</footer>
    </main>
  );
}