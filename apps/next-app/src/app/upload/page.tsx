'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { Amplify } from 'aws-amplify';
import {
  getCurrentUser,
  fetchUserAttributes,
  signOut,
} from 'aws-amplify/auth';
// import { getUrl, uploadData } from 'aws-amplify/storage';

// ---- Amplify config (kept in this single file) ----
// Make sure these env vars exist in .env.local and are exposed as NEXT_PUBLIC_*
// Amplify.configure(
//   {
//     Auth: {
//       Cognito: {
//         userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
//         userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
//         identityPoolId: process.env.NEXT_PUBLIC_USER_POOL_IDENTITY_ID!,
//         loginWith: { email: true },
//       },
//     },
//     Storage: {
//       S3: {
//         bucket: process.env.NEXT_PUBLIC_S3_BUCKET!,
//         region: process.env.NEXT_PUBLIC_AWS_REGION!, 
//       },
//     },
//   },
//   { ssr: true }
// );
const token = process.env.NEXT_PUBLIC_API_TOKEN;

export default function Page() {
  const router = useRouter();

  // top bar state
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [topErr, setTopErr] = useState<string | null>(null);

  // upload state
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await getCurrentUser(); // throws if not signed in
        let friendly = u.username;
        try {
          const attrs = await fetchUserAttributes();
          friendly =
            attrs.name?.trim() ||
            attrs.given_name?.trim() ||
            attrs.email?.trim() ||
            u.username;
        } catch {
          // attributes may be locked down; ignore
        }
        if (mounted) setDisplayName(friendly);
      } catch {
        router.replace('/login');
        return;
      } finally {
        if (mounted) setAuthChecked(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    setTopErr(null);
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/');
    } catch (e: any) {
      setTopErr(e?.message || 'Failed to sign out');
    } finally {
      setSigningOut(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('Uploading...');
    setFileUrl(null);
    setProgress(0);
    
    try {
      const form = new FormData();
      // field name must be "file" to match your curl: -F file=@...
      form.append('file', file);

      const res = await fetch(
        'http://bff-service.services.svc.cluster.local/api/upload',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
          },
          body: form,
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `Upload failed: ${res.status} ${res.statusText}${
            text ? ` - ${text}` : ''
          }`
        );
      }

      let data: any = null;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setStatus('Uploaded');
      if (data?.url) {
        setFileUrl(data.url);
      }
    } catch (err: any) {
      setStatus(err?.message || 'Upload failed');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
      setProgress(0);
    }

    // You can namespace keys by user or date; here we timestamp.
    // const objectPath = `uploads/${Date.now()}-${file.name}`;

    // try {
    //   const task = uploadData({
    //     path: objectPath,
    //     data: file,
    //     options: {
    //       contentType: file.type || 'application/octet-stream',
    //       onProgress: ({ transferredBytes, totalBytes }) => {
    //         if (totalBytes) {
    //           setProgress(Math.round((transferredBytes / totalBytes) * 100));
    //         }
    //       },
    //     },
    //   })
    //   console.log("Pdf uploaded sucessfully", task);
    //   const { path } = await task.result;
    //   const { url } = await getUrl({path})
    //   setFileUrl(url.toString())
    //   console.log(path);
    // } catch (e: any) {
    //   setStatus(e?.message || 'Upload failed');
    // } finally {
    //   if (inputRef.current) inputRef.current.value = '';
    //   setProgress(0);
    // }
  }

  if (!authChecked) return null; // avoid UI flash while checking

  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="w-full border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="font-semibold">My App</div>
          <div className="flex items-center gap-3">
            {displayName && (
              <span className="text-sm text-slate-600">
                Hello, <strong>{displayName}</strong>
              </span>
            )}
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="rounded px-3 py-1.5 text-sm border hover:underline cursor-pointer"
            >
              {signingOut ? 'Signing out…' : 'Logout'}
            </button>
            {topErr && <span className="text-sm text-red-600">{topErr}</span>}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">
          Upload file to S3 Bucket
        </h1>

        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp,.gif"
          className="w-full text-slate-600 bg-white border file:cursor-pointer cursor-pointer file:border-0 file:py-3 file:px-4 file:mr-4 file:bg-gray-100 file:hover:bg-gray-200 rounded"
          onChange={onFileChange}
        />

        {progress > 0 && progress < 100 && (
          <div className="w-full h-2 bg-gray-200 rounded mt-3">
            <div
              className="h-2 rounded"
              style={{ width: `${progress}%`, background: 'black' }}
            />
          </div>
        )}

        {status && <p className="text-sm mt-3">{status}</p>}

        {fileUrl && (
          <a
            className="text-lg font-semibold mt-2"
            href={fileUrl}
            target="_blank"
          >
            Successfully uploading! <span className='underline text-blue-500'>View uploaded file</span>
          </a>
        )}

        <p className="text-xs text-slate-500 mt-4">
          PNG, JPG, SVG, WEBP, and GIF are allowed.
        </p>
      </div>
    </main>
  );
}
