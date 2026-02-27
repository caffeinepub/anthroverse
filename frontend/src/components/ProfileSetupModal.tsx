import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRegisterUser, useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ROOT_ADMIN_EMAIL } from '../lib/utils';

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const registerUser = useRegisterUser();
  const { refetch: refetchProfile } = useGetCallerUserProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const isRootAdmin = email.trim().toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await registerUser.mutateAsync({ name: name.trim(), email: email.trim() });

      // Force an immediate refetch so App.tsx transitions to the main app
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      await refetchProfile();

      if (isRootAdmin) {
        toast.success('Welcome back, Root Admin!');
      } else {
        toast.success('Welcome to AnthroVerse! Your account is ready.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error?.message || 'Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4"
      style={{
        backgroundImage: 'url(/assets/generated/anthroverse-bg.dim_900x1600.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      <Card className="relative z-10 w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="flex justify-center">
            <img
              src="/assets/generated/anthroverse-logo.dim_256x256.png"
              alt="AnthroVerse"
              className="w-16 h-16 rounded-2xl object-cover"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to AnthroVerse</CardTitle>
          <CardDescription>
            Set up your profile to get started with the community.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={registerUser.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={registerUser.isPending}
                required
              />
              {isRootAdmin && (
                <p className="text-xs text-primary font-medium">
                  ✓ Root Admin account detected
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerUser.isPending || !name.trim() || !email.trim()}
            >
              {registerUser.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Setting up your profile...
                </span>
              ) : (
                'Get Started'
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Logged in as:{' '}
            <span className="font-mono text-xs">
              {identity?.getPrincipal().toString().slice(0, 12)}...
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
