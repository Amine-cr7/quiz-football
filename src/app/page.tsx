'use client'
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
 const sentence = "The quick brown fox jumped over the lazy dog"
 let maxWord = ""
  for(let i = 0 ; i <= sentence.length ; i++){
    maxWord += sentence[i]
    if(sentence[i] === " "){
      console.log(maxWord)
    }
    
  }
 

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
      <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center"> 
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/auth"
            className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-900 font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 flex-1 text-center"
          >
            Sign Up / Login
          </Link>
        </div>
      </main>
    </div>
  );
}