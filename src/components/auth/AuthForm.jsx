// components/auth/AuthForm.jsx
'use client'
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import EmailStepForm from './EmailStepForm';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import ErrorDisplay from './ErrorDisplay';

export default function AuthForm() {
  const [step, setStep] = useState(1); // 1 for email, 2 for auth
  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  
  const {
    loading,
    error,
    setError,
    checkEmailExists,
    handleLogin,
    handleSignUp,
    handleAnonymousLogin,
    handleGoogleLogin,
  } = useAuth();

  const handleEmailSubmit = async (emailValue) => {
    setEmail(emailValue);
    setError('');
    
    try {
      const exists = await checkEmailExists(emailValue);
      setEmailExists(exists);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setError('');
  };

  const getTitle = () => {
    if (step === 1) return 'Welcome';
    return emailExists ? 'Login' : 'Create Account';
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {getTitle()}
      </h2>

      <ErrorDisplay error={error} />

      {step === 1 ? (
        <EmailStepForm
          onEmailSubmit={handleEmailSubmit}
          onGoogleLogin={handleGoogleLogin}
          onAnonymousLogin={handleAnonymousLogin}
          loading={loading}
        />
      ) : emailExists ? (
        <LoginForm
          email={email}
          onLogin={handleLogin}
          onBack={handleBackToEmail}
          loading={loading}
        />
      ) : (
        <SignUpForm
          email={email}
          onSignUp={handleSignUp}
          onBack={handleBackToEmail}
          loading={loading}
        />
      )}
    </div>
  );
}