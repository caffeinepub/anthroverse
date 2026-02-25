import React, { useState } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

interface AuthPageProps {
  showSignup?: boolean;
}

export default function AuthPage({ showSignup = false }: AuthPageProps) {
  const [view, setView] = useState<'login' | 'signup'>(showSignup ? 'signup' : 'login');

  return (
    <AuthLayout>
      {view === 'login' ? (
        <LoginForm onSwitchToSignup={() => setView('signup')} />
      ) : (
        <SignupForm
          onSwitchToLogin={() => setView('login')}
          onSignupComplete={() => setView('login')}
        />
      )}
    </AuthLayout>
  );
}
