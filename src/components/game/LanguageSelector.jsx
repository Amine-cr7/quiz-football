// src/components/game/LanguageSelector.jsx
"use client";
import { useState } from 'react';

export default function LanguageSelector({ onLanguageSelect, selectedLanguage }) {
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-center">Choose Your Language</h2>
      <p className="text-gray-600 text-center mb-6">
        Select your preferred language for the game questions
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageSelect(lang.code)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${selectedLanguage === lang.code
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              }`}
          >
            <div className="text-3xl mb-2">{lang.flag}</div>
            <div className="font-semibold">{lang.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
