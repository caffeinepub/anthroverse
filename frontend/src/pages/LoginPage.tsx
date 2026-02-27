import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/PSX_20260227_075738(1).jpg')" }}
      />
      {/* Purple overlay */}
      <div className="absolute inset-0 auth-overlay" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-8 shadow-2xl text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img
                src="/assets/generated/anthroverse-logo.dim_256x256.png"
                alt="AnthroVerse Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/generated/logo-mark.dim_256x256.png";
                }}
              />
            </div>
          </div>

          <h1 className="font-poppins text-3xl font-bold text-primary-700 mb-1">AnthroVerse</h1>
          <p className="text-sm text-muted-foreground font-inter mb-2">Anthropos Chapter Platform</p>
          <div className="w-12 h-0.5 bg-gold mx-auto mb-6" />

          <p className="text-foreground font-inter mb-8 text-sm leading-relaxed">
            A private governance and communication platform for the Anthropos chapter. Members only.
          </p>

          <button
            onClick={() => login()}
            disabled={isLoggingIn}
            className="w-full gradient-primary text-white font-poppins font-semibold py-3 px-6 rounded-xl transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Login with Internet Identity"
            )}
          </button>

          <p className="mt-4 text-xs text-muted-foreground font-inter">
            Secure, decentralized authentication
          </p>
        </div>

        <p className="text-center text-white/60 text-xs mt-6 font-inter">
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
