import { useState } from 'react';
import { useGetCallerUserProfile, useUploadProfilePic, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ExternalBlob } from '../backend';
import { roleToLabel } from '../lib/utils';
import { Camera, Save } from 'lucide-react';

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const uploadProfilePic = useUploadProfilePic();
  const saveProfile = useSaveCallerUserProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleStartEdit = () => {
    setName(userProfile?.name ?? '');
    setEmail(userProfile?.email ?? '');
    setEditing(true);
    setSaveError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSaveError('');
    try {
      await saveProfile.mutateAsync({
        ...userProfile,
        name: name.trim(),
        email: email.trim(),
      });
      setEditing(false);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save profile');
    }
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
    await uploadProfilePic.mutateAsync(blob);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Profile not found.</p>
      </div>
    );
  }

  const avatarUrl = userProfile.profilePic ? userProfile.profilePic.getDirectURL() : null;
  const initials = userProfile.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userProfile.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {initials}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
            </label>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{userProfile.name}</p>
            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {roleToLabel(userProfile.role)}
            </span>
          </div>
        </div>

        {/* Principal */}
        {identity && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Principal ID</p>
            <p className="text-xs font-mono bg-muted px-3 py-2 rounded-lg break-all text-foreground">
              {identity.getPrincipal().toString()}
            </p>
          </div>
        )}

        {/* Edit form */}
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                required
              />
            </div>
            {saveError && <p className="text-destructive text-sm">{saveError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saveProfile.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveProfile.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} AnthroVerse — Built with{' '}
          <span className="text-rose-500">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'anthroverse')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
