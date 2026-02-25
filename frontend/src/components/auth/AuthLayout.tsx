import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/generated/auth-bg.dim_1200x800.png)' }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-cosmic-deep/70 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="AnthroVerse"
            className="w-20 h-20 rounded-2xl object-cover shadow-glow mb-4"
          />
          <h1 className="font-display font-bold text-3xl gold-text">AnthroVerse</h1>
          <p className="text-white/60 text-sm mt-1 font-body">Anthropos Chapter · Members Only</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-cosmic p-6">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6">
          © {new Date().getFullYear()} AnthroVerse · Built with{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'anthroverse')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400/70 hover:text-amber-400 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
