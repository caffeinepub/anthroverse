import { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useRegisterUser, useUploadProfilePic } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';

type Step = 'connect' | 'profile';

export default function SignupForm() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const registerUser = useRegisterUser();
  const uploadProfilePic = useUploadProfilePic();

  const [step, setStep] = useState<Step>('connect');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await login();
      setStep('profile');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    }
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPicPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setError('');
    try {
      await registerUser.mutateAsync({ name: name.trim(), email: email.trim() });

      if (picFile) {
        const bytes = new Uint8Array(await picFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
        await uploadProfilePic.mutateAsync(blob);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile');
    }
  };

  if (step === 'connect' || !identity) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Connect with Internet Identity to join AnthroVerse
        </p>
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loginStatus === 'logging-in'}
          className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loginStatus === 'logging-in' ? 'Connecting…' : 'Connect with Internet Identity'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleProfileSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">Complete your profile</p>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          placeholder="Your full name"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          placeholder="your@email.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Profile Picture (optional)</label>
        {picPreview ? (
          <div className="flex items-center gap-3">
            <img src={picPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover" />
            <button
              type="button"
              onClick={() => { setPicFile(null); setPicPreview(null); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            <span className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors">Choose file</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
          </label>
        )}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <button
        type="submit"
        disabled={registerUser.isPending || uploadProfilePic.isPending || !name.trim() || !email.trim()}
        className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {registerUser.isPending || uploadProfilePic.isPending ? 'Saving…' : 'Create Profile'}
      </button>
    </form>
  );
}
