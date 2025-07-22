// components/auth/EmailStepForm.jsx
'use client'
import { useState } from 'react';
import SocialAuthButtons from './SocialAuthButtons';

export default function EmailStepForm({ 
  onEmailSubmit, 
  onGoogleLogin, 
  onAnonymousLogin, 
  loading 
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    setError('');
    onEmailSubmit(email);
  };

  return (
    <div className="space-y-4">
      {/* Social Auth Buttons */}
      <SocialAuthButtons
        onGoogleLogin={onGoogleLogin}
        onAnonymousLogin={onAnonymousLogin}
        loading={loading}
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
            required
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className={`w-full py-2 px-4 rounded text-white font-medium transition-colors ${
            loading || !email ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          By continuing, you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}