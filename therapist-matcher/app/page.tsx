"use client"

import VoiceInterface from '@/components/VoiceInterface'

 export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-2 text-gray-900"> Find Your Therapist</h1>
      <p className="text-center text-gray-600 mb-12"> Answer a few questions and we'll match you with compatible therapists </p>
      <VoiceInterface /> 
    </div>
    </div>
    
  )
 }
