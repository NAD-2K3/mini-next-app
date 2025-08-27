'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/lib/amplifyClient';
import { signIn, getCurrentUser } from 'aws-amplify/auth';

export default function Page() {
const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        try {
          await getCurrentUser();
          router.replace('/');
        } catch {
        }
      })();
    }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn({ username: email, password });

      router.push('/upload'); // 
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <section className="card">
        <h1 className="title">Sign in</h1>
        <form onSubmit={handleSubmit} noValidate>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            className="input"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}

          <button type="submit" className="button" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="muted">
          Don’t have an account?{' '}
          <a href="/signup" className="link">
            Create one
          </a>
        </p>
      </section>

      <style jsx>{`
        .container {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #f7f7fb;
        }
        @media (prefers-color-scheme: dark) {
          .container {
            background: #ffffffff;
          }
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border: 1px solid #e6e7eb;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 10px 18px rgba(0, 0, 0, 0.04),
            0 2px 6px rgba(0, 0, 0, 0.04);
        }
        @media (prefers-color-scheme: dark) {
          .card {
            background: #111214;
            border-color: #22242a;
            box-shadow: none;
          }
        }

        .title {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #000000;
        }

        form {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 8px;
        }

        .label {
          color: #000000;
          font-size: 13px;
          font-weight: 500;
        }

        .input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d9dbe3;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: #fff;
        }
        .input::placeholder {
          color: #9aa1ac;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }
        @media (prefers-color-scheme: dark) {
          .input {
            background: #0b0c0f;
            border-color: #2a2d36;
            color: #e7e9ee;
          }
          .input::placeholder {
            color: #737a87;
          }
          .input:focus {
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25);
          }
        }

        .error {
          margin-top: 2px;
          padding: 8px 10px;
          border-radius: 8px;
          background: #ffe8e8;
          color: #a60e0e;
          border: 1px solid #ffd1d1;
          font-size: 13px;
        }
        @media (prefers-color-scheme: dark) {
          .error {
            background: rgba(255, 99, 99, 0.12);
            border-color: rgba(255, 99, 99, 0.25);
            color: #ffb3b3;
          }
        }

        .button {
          margin-top: 6px;
          width: 100%;
          padding: 10px 12px;
          border: 0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(90deg, #6366f1, #3b82f6);
          cursor: pointer;
          transition: filter 0.15s, transform 0.02s;
        }
        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .button:active {
          transform: translateY(1px);
        }

        .muted {
          margin: 14px 0 0;
          font-size: 13px;
          color: #6b7280;
          text-align: center;
        }
        .link {
          color: #4f46e5;
          text-decoration: none;
        }
        .link:hover {
          text-decoration: underline;
        }
        @media (prefers-color-scheme: dark) {
          .muted {
            color: #9aa1ac;
          }
          .link {
            color: #8ea2ff;
          }
        }
      `}</style>
    </main>
  );
}
