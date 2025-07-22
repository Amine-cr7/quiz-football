// src/components/ui/PlayerAvatar.jsx
"use client";
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function PlayerAvatar({ userId, size = 'md' }) {
  const [userData, setUserData] = useState(null);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

useEffect(() => {
  if (!userId) return;
  
  const fetchUser = async () => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // Fallback for unknown users
        setUserData({
          displayName: 'Unknown User',
          photoURL: null
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUserData({
        displayName: 'Unknown User',
        photoURL: null
      });
    }
  };
  
  fetchUser();
}, [userId]);

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden`}>
      {userData?.photoURL ? (
        <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-600 font-bold text-lg">
          {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
        </span>
      )}
    </div>
  );
}