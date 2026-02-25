import React, { useState, useRef } from 'react';
import { useSaveCallerUserProfile, useUploadProfilePic } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, User } from 'lucide-react';

export default function ProfileSetupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = useSaveCallerUserProfile();
  const uploadProfilePic = useUploadProfilePic();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    await saveProfile.mutateAsync({
      name: name.trim(),
      email: email.trim(),
      role: { member: null } as any,
      isApproved: false,
      profilePic: undefined,
    });

    if (photoFile) {
      const bytes = new Uint8Array(await photoFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct)
      );
      await uploadProfilePic.mutateAsync(blob);
    }
  };

  const isLoading = saveProfile.isPending || uploadProfilePic.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl border border-border p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-bold text-2xl text-foreground mb-2">
              Set Up Your Profile
            </h1>
            <p className="text-muted-foreground text-sm">
              Tell us about yourself to complete your registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full cursor-pointer overflow-hidden border-2 border-dashed border-primary/40 hover:border-primary transition-colors flex items-center justify-center bg-muted relative"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-primary hover:underline"
              >
                {photoPreview ? 'Change photo' : 'Upload profile photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            {isLoading && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading photo...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {saveProfile.isError && (
              <p className="text-destructive text-sm">
                {saveProfile.error?.message ?? 'Registration failed. Please try again.'}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !email.trim()}
              className="w-full"
            >
              {isLoading ? 'Setting up...' : 'Complete Registration'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
