// components/auth/ErrorDisplay.jsx
'use client'

export default function ErrorDisplay({ error }) {
  if (!error) return null;

  return (
    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
      {error}
    </div>
  );
}