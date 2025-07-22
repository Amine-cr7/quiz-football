// components/auth/SignUpForm.jsx
'use client'
import { useState } from 'react';

export default function SignUpForm({ email, onSignUp, onBack, loading }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSignUp(email, '', password); // Username will be set in profile setup
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-blue-50 text-blue-800 rounded">
        <p className="font-medium">Email: {email}</p>
      </div>

      <div>
        <label htmlFor="password" className="block mb-1 font-medium">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          required
          minLength={6}
        />
        <p className="text-sm text-gray-500 mt-1">
          At least 6 characters
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2 px-4 rounded border border-gray-300 font-medium hover:bg-gray-100 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-2 px-4 rounded text-white font-medium transition-colors ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </div>
    </form>
  );
}