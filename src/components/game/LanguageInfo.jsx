// src/components/game/LanguageInfo.jsx
"use client";

const LANGUAGE_NAMES = {
  'en': 'English',
  'ar': 'العربية',
  'fr': 'Français'
};

export default function LanguageInfo({ language = 'en' }) {
  return (
    <div className="bg-blue-50 rounded-lg p-3 text-center">
      <p className="text-sm text-blue-700">
        Playing in: {' '}
        <span className="font-semibold">
          {LANGUAGE_NAMES[language] || 'English'}
        </span>
      </p>
    </div>
  );
}