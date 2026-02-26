import { useState } from 'react';
import LoginPage from './LoginPage';
import SignupForm from '../components/auth/SignupForm';

interface AuthPageProps {
  showSignup?: boolean;
}

export default function AuthPage({ showSignup = false }: AuthPageProps) {
  const [view, setView] = useState<'login' | 'signup'>(showSignup ? 'signup' : 'login');

  if (view === 'login') {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/assets/generated/logo-mark.dim_256x256.png"
            alt="AnthroVerse"
            className="w-16 h-16 rounded-xl mb-3"
          />
          <h1 className="text-2xl font-bold text-foreground">Join AnthroVerse</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your account</p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <button
            onClick={() => setView('login')}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
