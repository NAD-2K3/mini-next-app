'use client';

import React, { useState } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  ISignUpResult,
} from 'amazon-cognito-identity-js';

type Phase = 'form' | 'verify' | 'done';

export default function SignupPage() {
  const [phase, setPhase] = useState<Phase>('form');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [usernameForVerify, setUsernameForVerify] = useState('');

  const pool = new CognitoUserPool({
    UserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
    ClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
  });

  const getUser = (username: string) =>
    new CognitoUser({ Username: username, Pool: pool });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!email || !password || !confirmPassword) {
      setMsg('Please fill all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ];

      await new Promise<ISignUpResult>((resolve, reject) => {
        pool.signUp(email, password, attributes, [], (err, result) => {
          if (err || !result) return reject(err);
          resolve(result);
        });
      });

      setUsernameForVerify(email);
      setPhase('verify');
      setMsg('Sign up successful. Check your email for the verification code.');
    } catch (err: any) {
      setMsg(err?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!code) {
      setMsg('Enter the verification code.');
      return;
    }

    setLoading(true);
    try {
      const user = getUser(usernameForVerify);
      await new Promise((resolve, reject) => {
        user.confirmRegistration(code, true, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      setPhase('done');
    } catch (err: any) {
      setMsg(err?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const user = getUser(usernameForVerify);
      await new Promise((resolve, reject) => {
        user.resendConfirmationCode((err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      setMsg('Verification code resent.');
    } catch (err: any) {
      setMsg(err?.message || 'Could not resend the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-3xl mb-6 text-center">Create account</h1>

          {msg && (
            <div className="mb-4 rounded-md border p-3 text-sm">{msg}</div>
          )}

          {phase === 'form' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  className="w-full rounded-xl border px-3 py-2 ring focus:outline-none focus:ring"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Password</label>
                <input
                  type="password"
                  className="w-full rounded-xl border px-3 py-2 ring focus:outline-none focus:ring"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Confirm password</label>
                <input
                  type="password"
                  className="w-full rounded-xl border px-3 py-2 ring focus:outline-none focus:ring"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black text-white py-2 font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Signing up...' : 'Sign up'}
              </button>
            </form>
          )}

          {phase === 'verify' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <p className="text-sm">
                We sent a code to{' '}
                <span className="font-medium">{usernameForVerify}</span>.
              </p>
              <div>
                <label className="block text-sm mb-1">Verification code</label>
                <input
                  type="text"
                  className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black text-white py-2 font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify email'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="w-full rounded-xl border py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Resend code
              </button>
            </form>
          )}

          {phase === 'done' && (
            <div className="space-y-4 text-center">
              <p className="text-sm">
                Your email is verified. You can log in now.
              </p>
              <a
                href="/login"
                className="mt-4 inline-block outline-2 text-black px-4 py-2 font-medium hover:text-blue-300"
              >
                Go to login
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-800 pt-6">
          Already have an account?{' '}
          <a className="underline hover:text-blue-500" href="/login">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
