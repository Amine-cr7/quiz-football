// src/app/api/game/route.js (Updated)
import { NextResponse } from "next/server";
import { joinOrCreateGame } from "@/lib/game";

export async function POST(req) {
  try {
    const { userId, language } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const { gameId, status } = await joinOrCreateGame(userId, language || 'en');
    return NextResponse.json({ gameId, status });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create game" },
      { status: 500 }
    );
  }
}