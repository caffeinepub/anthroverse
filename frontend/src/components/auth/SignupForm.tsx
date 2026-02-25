import React, { useState, useRef, useEffect } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useSaveCallerUserProfile, useUploadProfilePic } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Camera, User, Mail, Fingerprint, CheckCircle } from 'lucide-react';

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSignupComplete: () => void;
}

export default function SignupForm({ onSwitchToLogin, onSignupComplete }: SignupFormProps) {
  const { login, loginStatus, identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const uploadProfilePic = useUploadProfilePic();

  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    if (identity && step === 'auth') {
      setStep('profile');
    }
  }, [identity, step]);

  const handleConnectIdentity = () => {
    login();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photo: 'Please select an image file' }));
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, photo: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) newErrors.name = 'Please enter your full name';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email';
    if (!photoFile) newErrors.photo = 'Profile photo is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !identity) return;

    setIsSubmitting(true);
    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        role: { member: null } as any,
        isApproved: false,
        profilePic: undefined,
      });

      if (photoFile) {
        const arrayBuffer = await photoFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setUploadProgress(pct));
        await uploadProfilePic.mutateAsync(blob);
      }

      onSignupComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrors(prev => ({ ...prev, submit: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'auth') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-display font-bold text-2xl text-white">Create Account</h2>
          <p className="text-white/60 text-sm mt-1">First, connect your Internet Identity</p>
        </div>

        <Button
          onClick={handleConnectIdentity}
          disabled={isLoggingIn}
          className="w-full h-12 font-display font-semibold text-base gold-gradient text-cosmic-deep hover:opacity-90 transition-opacity border-0 rounded-xl shadow-glow"
        >
          {isLoggingIn ? (
            <><Loader2 size={18} className="animate-spin mr-2" />Connecting...</>
          ) : (
            <><Fingerprint size={18} className="mr-2" />Connect Internet Identity</>
          )}
        </Button>

        <div className="text-center pt-2 border-t border-white/10">
          <span className="text-white/50 text-sm">Already have an account? </span>
          <button
            onClick={onSwitchToLogin}
            className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <h2 className="font-display font-bold text-2xl text-white">Complete Your Profile</h2>
        <p className="text-white/60 text-sm mt-1">Tell us about yourself</p>
      </div>

      {errors.submit && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300">
          {errors.submit}
        </div>
      )}

      {/* Profile Photo */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-amber-400/50 hover:border-amber-400 transition-colors bg-white/5 flex items-center justify-center group"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Camera size={24} className="text-amber-400/60 group-hover:text-amber-400 transition-colors" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        <span className="text-white/50 text-xs">
          {photoFile ? photoFile.name : 'Upload profile photo (required)'}
        </span>
        {errors.photo && <span className="text-red-400 text-xs">{errors.photo}</span>}
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-white/70 text-sm">Full Name</Label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your real full name"
            className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-amber-400/60 rounded-xl"
          />
        </div>
        {errors.name && <span className="text-red-400 text-xs">{errors.name}</span>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label className="text-white/70 text-sm">Email Address</Label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-white/30 focus:border-amber-400/60 rounded-xl"
          />
        </div>
        {errors.email && <span className="text-red-400 text-xs">{errors.email}</span>}
      </div>

      {isSubmitting && uploadProgress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/50">
            <span>Uploading photo...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 font-display font-semibold text-base gold-gradient text-cosmic-deep hover:opacity-90 transition-opacity border-0 rounded-xl shadow-glow"
      >
        {isSubmitting ? (
          <><Loader2 size={18} className="animate-spin mr-2" />Creating Account...</>
        ) : (
          <><CheckCircle size={18} className="mr-2" />Complete Registration</>
        )}
      </Button>

      <div className="text-center pt-2 border-t border-white/10">
        <span className="text-white/50 text-sm">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
        >
          Sign In
        </button>
      </div>
    </form>
  );
}
