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

    const sortedInsurance = therapist.insurance_list?.sort((a: string) =>
        a === userInsurance ? -1 : 1
    )

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full w-full max-w-sm mx-auto min-h-[150px]">
            <div className="flex flex-col gap-3 flex-1">
                {/* Header row */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                        {initials}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{therapist.name}</h3>
                        <p className="text-gray-500 text-sm">📍 {therapist.location}</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                        {therapist.session_type && therapist.session_type === "online" &&
                            <Monitor className="text-purple-600" size={16}> </Monitor>
                        }
                        {therapist.session_type && therapist.session_type === "in-person" &&
                            <MapPin className="text-purple-600" size={16}></MapPin>
                        }
                        {therapist.session_type && therapist.session_type === "both" &&
                            <div className="flex gap-1">
                                <Monitor className="text-purple-600" size={16}></Monitor>
                                <MapPin className="text-purple-600" size={16} ></MapPin>
                            </div>
                        }
                    </div>
                </div>

                {/* Specialty tags */}
                <div className="flex flex-wrap gap-1">
                    {therapist.specialty?.map((s: string, i: number) => (
                        <span key={i} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                            {s.trim()}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-3">
                <p className="text-gray-400 text-xs flex-1 leading-relaxed">
                    {sortedInsurance.slice(0, 5).join(", ")}
                </p>
                <button onClick={onReachOut} className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 flex-shrink-0">
                    Reach Out →
                </button>
            </div>

            <div>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                    {therapist.match_reason}
                </p>
            </div>
        </div>
    )
}