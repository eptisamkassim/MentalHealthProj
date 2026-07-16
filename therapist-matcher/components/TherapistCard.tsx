"use client"
import { Monitor, MapPin } from 'lucide-react'

interface Therapist {
    name: string
    specialty: string[]
    location: string
    insurance_list: string[]
    session_type?: string
    match_reason?: string
}

export default function TherapistCard({ therapist, userInsurance, onReachOut }:
    {
        therapist: Therapist
        userInsurance: string
        onReachOut: () => void
    }) {

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
                <button
                    onClick={onReachOut}
                    className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors shrink-0"
                >
                    Reach out →
                </button>
            </div>

            {/* Match explanation */}
            {therapist.match_reason && (
                <p className="text-ink-soft text-sm leading-relaxed border-t border-line pt-3">
                    {therapist.match_reason}
                </p>
            )}
        </div>
    )
}