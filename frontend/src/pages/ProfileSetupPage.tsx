import { useState } from 'react';
import { useSaveCallerUserProfile, useUploadProfilePic } from '../hooks/useQueries';
import { Role } from '../backend';
import { ExternalBlob } from '../backend';
import { useNavigate } from '@tanstack/react-router';

export default function ProfileSetupPage() {
  const saveProfile = useSaveCallerUserProfile();
  const uploadProfilePic = useUploadProfilePic();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPicPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setError('');
    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        role: Role.member,
        isApproved: false,
        profilePic: undefined,
        companyName: '',
        description: '',
      });

      if (picFile) {
        const bytes = new Uint8Array(await picFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
        await uploadProfilePic.mutateAsync(blob);
      }

      navigate({ to: '/' });
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="AnthroVerse"
            className="w-16 h-16 rounded-xl mb-3"
          />
          <h1 className="text-2xl font-bold text-foreground">Set Up Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Tell us a bit about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
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
                <span className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors">
                  Choose file
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
              </label>
            )}
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saveProfile.isPending || uploadProfilePic.isPending || !name.trim() || !email.trim()}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saveProfile.isPending || uploadProfilePic.isPending ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
