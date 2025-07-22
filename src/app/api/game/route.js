// src/app/api/game/route.js (Updated)
import { NextResponse } from "next/server";
import { joinOrCreateGame } from "@/lib/game";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, language } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate language parameter
    const supportedLanguages = ['en', 'ar', 'fr', 'de', 'es', 'pt'];
    const selectedLanguage = language && supportedLanguages.includes(language) ? language : 'en';
    
    const result = await joinOrCreateGame(userId, selectedLanguage);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in game API:", error);
    
    // More specific error handling
    if (error.message.includes('already in an active game')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict
      );
    }
    
    if (error.message.includes('questions available')) {
      return NextResponse.json(
        { error: "Game temporarily unavailable. Please try again later." },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create game" },
      { status: 500 }
    );
  }
}