import React, { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Loader2, Fingerprint } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState('');

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = () => {
    setError('');
    try {
      login();
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display font-bold text-2xl text-white">Welcome Back</h2>
        <p className="text-white/60 text-sm mt-1">Sign in to access your community</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full h-12 font-display font-semibold text-base gold-gradient text-cosmic-deep hover:opacity-90 transition-opacity border-0 rounded-xl shadow-glow"
        >
          {isLoggingIn ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Fingerprint size={18} className="mr-2" />
              Sign In with Internet Identity
            </>
          )}
        </Button>

        <div className="text-center text-white/40 text-xs">
          Secure, passwordless authentication powered by the Internet Computer
        </div>
      </div>

      <div className="text-center pt-2 border-t border-white/10">
        <span className="text-white/50 text-sm">New to AnthroVerse? </span>
        <button
          onClick={onSwitchToSignup}
          className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
