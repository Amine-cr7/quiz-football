'use client'
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center min-h-screen"> 
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Quiz Championship
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Test your knowledge, climb the divisions, and compete for the championship in our multilingual quiz platform!
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-lg font-semibold mb-2">Division System</h3>
              <p className="text-blue-100 text-sm">Climb from Division 5 to Division 1 and compete for the top spot</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="text-lg font-semibold mb-2">Multiple Languages</h3>
              <p className="text-blue-100 text-sm">Play in English, Arabic, French, German, Spanish, or Portuguese</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Real-time Battles</h3>
              <p className="text-blue-100 text-sm">Challenge other players in fast-paced quiz matches</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link
              href="/auth"
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200 flex-1 text-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🚀 Start Playing
            </Link>
          </div>

          <p className="mt-6 text-blue-200 text-sm">
            Join thousands of players competing for the championship
          </p>
        </div>
      </main>
    </div>
  );
}