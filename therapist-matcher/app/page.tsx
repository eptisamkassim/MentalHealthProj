"use client"

import VoiceInterface from '@/components/VoiceInterface'

const steps = [
  {
    number: "01",
    title: "Speak or type your needs",
    description: "Our AI asks a few follow-up questions to understand what you need and what matters to you.",
  },
  {
    number: "02",
    title: "Get ranked matches",
    description: "We match you by specialty, insurance, and bio similarity, with a plain-language explanation for each.",
  },
  {
    number: "03",
    title: "Send outreach in one click",
    description: "A personalized email is drafted per therapist, so you don't have to write it or cold-call an office.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-8 flex flex-col items-center text-center">
        <span className="inline-block mb-6 px-4 py-1.5 rounded-full text-sm font-medium bg-accent-bg text-accent-dark">
          Serving the Greater Boston area
        </span>
        <h1 className="font-display font-medium text-ink leading-[1.1] text-[46px] max-w-2xl">
          Find a therapist who truly fits
        </h1>
        <p className="mt-5 text-ink-soft text-lg leading-relaxed max-w-120">
          Speak or type what you&apos;re looking for. Our AI asks a few follow-up questions to understand what you need and what matters to you.
        </p>
        <div id="get-matched" className="mt-12 w-full max-w-2xl">
          <VoiceInterface />
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pt-10 pb-20" id="how-it-works">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div key={step.number}>
              <p className="font-display font-bold text-accent text-sm mb-3">{step.number}</p>
              <h3 className="font-display font-semibold text-ink text-lg mb-2">{step.title}</h3>
              <p className="text-ink-soft text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-accent-bg border-y border-line">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-center gap-24 text-center">
          {["Voice or text intake", "Insurance filtered upfront", "Auto-drafted outreach emails"].map((claim) => (
            <p key={claim} className="text-accent-dark text-sm font-semibold">{claim}</p>
          ))}
        </div>
      </section>
    </div>
  )
}
