// components/profile/ProfileSetup.jsx
'use client'
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/config/firebase';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'RU', name: 'Russia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'AR', name: 'Argentina' },
  // Add more countries as needed
];

export default function ProfileSetup() {
  const [username, setUsername] = useState('');
  const [nationality, setNationality] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const { loading, error, completeProfileSetup } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      router.push('/auth');
    }
  }, [router]);

  const validateUsername = (value) => {
    if (!value) {
      setUsernameError('Username is required');
      return false;
    }
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (value.length > 20) {
      setUsernameError('Username must be less than 20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    validateUsername(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateUsername(username)) {
      return;
    }

    if (!nationality) {
      return;
    }

    await completeProfileSetup(username, nationality);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Choose your username and nationality to get started
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block mb-1 font-medium">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                usernameError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your_username"
              required
              minLength={3}
              maxLength={20}
            />
            {usernameError ? (
              <p className="text-red-500 text-sm mt-1">{usernameError}</p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                3-20 characters, letters, numbers, and underscores only
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nationality" className="block mb-1 font-medium">
              Nationality
            </label>
            <select
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !nationality || usernameError}
            className={`w-full py-2 px-4 rounded text-white font-medium transition-colors ${
              loading || !username || !nationality || usernameError
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Setting up...' : 'Complete Profile'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            You can change these settings later in your profile
          </p>
        </div>
      </div>
    </div>
  );
}