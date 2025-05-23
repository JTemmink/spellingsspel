'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Verify password with API
      const response = await fetch('/api/parent-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: password.trim(),
          action: 'verify'
        })
      });

      const data = await response.json();

      if (data.valid) {
        // Store auth in localStorage
        localStorage.setItem('parentAuth', 'true');
        router.push('/parent-portal/dashboard');
      } else {
        setError('Onjuist wachtwoord. Probeer het opnieuw.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4" data-theme="light">
      {/* Background stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 card bg-white/90 backdrop-blur-sm shadow-2xl max-w-md w-full"
      >
        <div className="card-body">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">👨‍👩‍👧‍👦 Ouderportaal</h1>
            <p className="text-gray-600">Log in om instellingen te beheren</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Wachtwoord</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Voer uw wachtwoord in"
                className="input input-bordered w-full"
                required
              />
              {error && (
                <label className="label">
                  <span className="label-text-alt text-error">{error}</span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full text-white"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Inloggen...
                </>
              ) : (
                'Inloggen'
              )}
            </button>
          </form>

          <div className="divider">Demo</div>
          
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-bold">Huidig Wachtwoord</h3>
              <div className="text-xs">Gebruik: <code>1001</code></div>
            </div>
          </div>

          <div className="text-center mt-4">
            <Link href="/">
              <button className="btn btn-ghost">
                ← Terug naar spellingsspel
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 