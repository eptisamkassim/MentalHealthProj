"use client"
import { useState } from 'react'
import { Monitor, MapPin, ChevronDown } from 'lucide-react'

interface Therapist {
    name: string
    specialty: string[]
    location: string
    insurance_list: string[]
    session_type?: string
    match_reason?: string
}

export default function TherapistCard({ therapist, userInsurance, onReachOut, emailSent, consultationQuestions }:
    {
        therapist: Therapist
        userInsurance: string
        onReachOut: () => void
        emailSent?: boolean
        consultationQuestions?: string[]
    }) {

    const [accordionOpen, setAccordionOpen] = useState(false)
    const initials = therapist.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
    const sortedInsurance = therapist.insurance_list?.sort((a: string) => a === userInsurance ? -1 : 1)

    return (
        <div className="bg-surface border border-line rounded-[14px] p-5 flex flex-col gap-3 w-full">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent-bg flex items-center justify-center text-accent-dark font-medium text-sm shrink-0">
                    {initials}
                </div>
                <div>
                    <h3 className="font-display font-medium text-ink">{therapist.name}</h3>
                    <p className="text-ink-soft text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {therapist.location}
                    </p>
                </div>
                <div className="ml-auto flex gap-1 text-ink-soft">
                    {therapist.session_type === "online" && <Monitor size={15} />}
                    {therapist.session_type === "in-person" && <MapPin size={15} />}
                    {therapist.session_type === "both" && (
                        <>
                            <Monitor size={15} />
                            <MapPin size={15} />
                        </>
                    )}
                </div>
            </div>

            {/* Specialty tags */}
            <div className="flex flex-wrap gap-1.5">
                {therapist.specialty?.map((s: string, i: number) => (
                    <span key={i} className="bg-accent-bg text-accent-dark text-xs px-2.5 py-1 rounded-full">
                        {s.trim()}
                    </span>
                ))}
            </div>

            {/* Insurance + CTA row */}
            <div className="flex items-center justify-between gap-3 mt-1">
                <p className="text-ink-soft text-xs flex-1 leading-relaxed">
                    {sortedInsurance.slice(0, 5).join(", ")}
                </p>
                {emailSent ? (
                    <span className="text-sm font-medium px-4 py-2 rounded-lg bg-accent-bg text-accent-dark shrink-0">
                        ✓ Email sent
                    </span>
                ) : (
                    <button
                        onClick={onReachOut}
                        className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors shrink-0"
                    >
                        Reach out →
                    </button>
                )}
            </div>

            {/* Match explanation */}
            {therapist.match_reason && (
                <p className="text-ink-soft text-sm leading-relaxed border-t border-line pt-3">
                    {therapist.match_reason}
                </p>
            )}

            {/* Consultation questions accordion */}
            {emailSent && consultationQuestions && consultationQuestions.length > 0 && (
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                    <div
                        onClick={() => setAccordionOpen(!accordionOpen)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                        <h4 style={{ fontSize: 13, margin: 0 }}>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Consultation questions</span>
                            <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}> — potential questions to check for fit.</span>
                        </h4>
                        <ChevronDown size={16} style={{ color: 'var(--ink-soft)', transform: accordionOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </div>
                    {accordionOpen && (
                        <div style={{ marginTop: 12, background: 'var(--accent-bg)', borderRadius: 10, padding: '6px 16px' }}>
                            {consultationQuestions.map((q, i) => (
                                <div
                                    key={i}
                                    style={{ display: 'flex', gap: 8, padding: '10px 0', borderBottom: i === consultationQuestions.length - 1 ? 'none' : '1px solid rgba(63,102,83,0.15)',
                                    }}
                                >
                                    <span style={{ flexShrink: 0, paddingTop: 1, fontSize: 12, fontWeight: 600, color: 'var(--accent-dark)', opacity: 0.6,
                                    }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--accent-dark)', textAlign: 'left' }}>
                                        {q}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
