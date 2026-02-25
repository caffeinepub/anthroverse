import React from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useRequestApproval } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, Bell, CheckCircle, Loader2 } from 'lucide-react';

export default function WaitingForApproval() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const requestApproval = useRequestApproval();
  const [requested, setRequested] = React.useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleRequestApproval = async () => {
    try {
      await requestApproval.mutateAsync();
      setRequested(true);
    } catch {
      // Already requested or error
      setRequested(true);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/assets/generated/auth-bg.dim_1200x800.png)' }}
      />
      <div className="absolute inset-0 bg-cosmic-deep/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="AnthroVerse"
            className="w-20 h-20 rounded-2xl object-cover shadow-glow mb-4"
          />
          <h1 className="font-display font-bold text-3xl gold-text">AnthroVerse</h1>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-cosmic p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center animate-pulse-gold">
              <Clock size={36} className="text-amber-400" />
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">Pending Approval</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Your account has been created and is awaiting approval from an administrator.
              You'll be notified once your account is approved.
            </p>
          </div>

          {requested ? (
            <div className="flex items-center justify-center gap-2 bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-3">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-green-300 text-sm font-medium">Approval request sent!</span>
            </div>
          ) : (
            <Button
              onClick={handleRequestApproval}
              disabled={requestApproval.isPending}
              className="w-full h-11 gold-gradient text-cosmic-deep font-semibold rounded-xl border-0 hover:opacity-90"
            >
              {requestApproval.isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" />Sending Request...</>
              ) : (
                <><Bell size={16} className="mr-2" />Request Approval</>
              )}
            </Button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mx-auto"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
