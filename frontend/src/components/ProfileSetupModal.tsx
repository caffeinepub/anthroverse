import { useState } from 'react';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileSetupModalProps {
  onComplete: () => void;
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !name.trim() || !email.trim()) return;
    setSaving(true);
    setError('');
    try {
      await actor.saveCallerUserProfile({
        name: name.trim(),
        email: email.trim(),
        role: { member: null } as any,
        isApproved: false,
        profilePic: undefined,
      });
      // Invalidate both profile and approval queries so App.tsx re-evaluates
      // the root admin bypass (isCallerApproved returns true after saveCallerUserProfile
      // sets AccessControl #admin for graph.dust@gmail.com)
      await qc.invalidateQueries({ queryKey: ['currentUserProfile'] });
      await qc.invalidateQueries({ queryKey: ['isCallerApproved'] });
      await Promise.all([
        qc.refetchQueries({ queryKey: ['currentUserProfile'] }),
        qc.refetchQueries({ queryKey: ['isCallerApproved'] }),
      ]);
      onComplete();
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="AnthroVerse"
            className="w-16 h-16 rounded-xl mb-3"
          />
          <h2 className="text-2xl font-bold text-foreground">Welcome to AnthroVerse</h2>
          <p className="text-muted-foreground text-sm mt-1">Set up your profile to get started</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your@email.com"
              required
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving || !name.trim() || !email.trim()}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
