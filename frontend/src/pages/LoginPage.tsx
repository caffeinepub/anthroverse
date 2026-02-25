import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '../components/LoadingSpinner';
import { Shield, Users, Zap } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [error, setError] = useState<string | null>(null);

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message !== 'User is already authenticated') {
        setError(message);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel */}
      <div className="hidden md:flex md:w-1/2 purple-gradient flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src="/assets/generated/auth-bg.dim_1200x800.png"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img src="/assets/generated/logo-mark.dim_256x256.png" alt="AnthroVerse" className="w-12 h-12 rounded-2xl" />
            <span className="font-poppins font-bold text-2xl text-white">AnthroVerse</span>
          </div>
          <h1 className="font-poppins font-bold text-4xl text-white leading-tight mb-4">
            The Private Executive Platform for Anthropos
          </h1>
          <p className="text-white/70 font-inter text-lg leading-relaxed">
            A secure digital operating system for governance, community, and leadership.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-4">
          {[
            { icon: Shield, title: 'Role-Based Access', desc: 'Structured permissions for every member' },
            { icon: Users, title: 'Private Community', desc: 'Members-only social network' },
            { icon: Zap, title: 'Governance Engine', desc: 'Automated tenure & leadership transitions' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-poppins font-semibold text-white text-sm">{title}</p>
                <p className="text-white/60 text-xs font-inter">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <img src="/assets/generated/logo-mark.dim_256x256.png" alt="AnthroVerse" className="w-10 h-10 rounded-xl" />
            <span className="font-poppins font-bold text-xl text-foreground">
              Anthro<span className="text-primary">Verse</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-poppins font-bold text-2xl text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground font-inter text-sm">
              Sign in to access the Anthropos chapter platform.
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-inter">
              {error}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-12 font-poppins font-semibold text-base rounded-xl purple-gradient border-0 text-white hover:opacity-90 transition-opacity"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Connecting...
              </span>
            ) : (
              'Sign In with Internet Identity'
            )}
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground font-inter">
            New members must be approved by an administrator before accessing the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
