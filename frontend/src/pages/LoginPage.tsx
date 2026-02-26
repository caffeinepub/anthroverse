import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: 'url(/assets/generated/auth-bg.dim_1200x800.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-5">
            <img
              src="/assets/generated/logo-mark.dim_256x256.png"
              alt="AnthroVerse"
              className="w-20 h-20 rounded-2xl shadow-lg"
            />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-1">AnthroVerse</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Your anthropology chapter community hub
          </p>

          <button
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {isLoggingIn ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Connecting...
              </span>
            ) : (
              'Login to AnthroVerse'
            )}
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            Secure login via Internet Identity
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/70 mt-6">
          © {new Date().getFullYear()} AnthroVerse · Built with{' '}
          <span className="text-rose-400">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
