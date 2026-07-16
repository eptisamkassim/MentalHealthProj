"use client"

import { useState, useRef, useEffect } from 'react'
import { Mic, ChevronLeft, ChevronRight, RefreshCw, Clock } from 'lucide-react'
import TherapistCard from '@/components/TherapistCard'
import ReactMarkdown from 'react-markdown'
// eslint-disable @typescript-eslint/no-explicit-any

function getUserId() {
    if (typeof window === "undefined") return ""

    let userId = localStorage.getItem("user_id") // Saves user id in browser storage
    if (!userId) {
        userId = crypto.randomUUID()
        localStorage.setItem("user_id", userId)
    }
    return userId
}


export default function VoiceInterface() {
    const [isRecording, setIsRecording] = useState(false)
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
    const [inputText, setInputText] = useState("")
    const [userId] = useState(() => getUserId())
    const [conversationId, setConversationId] = useState("")
    const [userPreferences, setUserPreferences] = useState<any>(null)
    const [therapists, setTherapists] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [emailDraft, setEmailDraft] = useState<{ email_subject: string, email_body: string, talking_points: string[] } | null>(null)
    const [selectedTherapist, setSelectedTherapist] = useState<any>(null)
    const [userName, setUserName] = useState("")
    const [isAiLoading, setAiLoadingState] = useState(false)
    const [isTherapistLoading, setTherapistLoadingState] = useState(false)
    const [isEmailLoading, setEmailLoadingState] = useState(false)
    const [emailFailureMessage, setEmailFailureMessage] = useState("")
    const [chatFailureMessage, setChatFailureMessage] = useState("")
    const [therapistFailureMessage, setTherapistFailureMessage] = useState("")
    const [insuranceFallback, setInsuranceFallback] = useState<{ active: boolean; insurance: string }>({ active: false, insurance: "" })
    const [emailSent, setEmailSent] = useState(false)
    const [consultationQuestions, setConsultationQuestions] = useState<string[]>([])
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const inputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scrolls to the latest chat message
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // Reset everything when button is pressed
    function resetAll() {
        setCurrentIndex(0)
        setConversationId("")
        setMessages([])
        setTherapists([])
        setUserPreferences(null)
        setChatFailureMessage("")
        setEmailFailureMessage("")
        setTherapistFailureMessage("")
        setEmailSent(false)
        setInsuranceFallback({ active: false, insurance: "" })
    }

    // Next in Therapist Carousel 
    function goNext() {
        if (currentIndex + 1 < therapists.length) {
            setCurrentIndex(currentIndex + 1)
        }
    }
    
    // Prev in Therapist Carousel 
    function goPrev() {
        if (currentIndex - 1 >= 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    // Emailing therapist
    async function handleReachOut(therapist: any) {
        setEmailLoadingState(true)
        setEmailFailureMessage("")
        setEmailSent(false)

        try {
            setSelectedTherapist(therapist)
            setShowModal(true)

            const response = await fetch("/api/email/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    therapist_id: therapist.id,
                    conversation_id: conversationId,
                    user_name: "",
                    user_email: "",
                    userPreferences: userPreferences
                })
            })
            const data = await response.json()
            setEmailDraft(data)
        } catch {
            setEmailFailureMessage("Unable to send an email")
        } finally {
            setEmailLoadingState(false)
        }
    }


    function toggleRecording() {
        if (isRecording) {
            stopRecording()
        }
        else {
            startRecording()
        }
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data)
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
        } catch {
            setChatFailureMessage("Microphone access denied")
        }
    }

    function stopRecording() {
        if (!mediaRecorderRef.current) return

        mediaRecorderRef.current.onstop = async () => {
            // combine chunks into one Blob
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop())
            await sendAudioToBackend(audioBlob)
        }

        mediaRecorderRef.current.stop()
        setIsRecording(false)
    }

    async function sendAudioToBackend(audioBlob: Blob) {
        try {
            const formData = new FormData()
            formData.append("file", audioBlob, "audio.webm")

            const response = await fetch("/api/voice/transcribe", {
                method: "POST",
                body: formData
            })

            const data = await response.json()
            await sendMessage(data.transcript)
        } catch {
            setChatFailureMessage("Voice transcription failed")
        }
    }

    // Sends a user message to the AI and gets a response
    // When enough info is collected it searches for therapists.
    async function sendMessage(voiceText?: string) {
        
        const messageText = voiceText || inputText

        if (!messageText) { // Don't send empty messages
            return
        }

        setMessages([...messages, { role: "user", content: messageText }])
        setInputText("")
        setAiLoadingState(true) 
        setChatFailureMessage("")
        let localTherapists: any[] = []

        // Send message to backend
        try {
            const response = await fetch("/api/chat/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_id: conversationId || null,
                    user_id: userId,
                    message: messageText
                })
            })

            const data = await response.json() // AI response
            setMessages(prev => [...prev, { role: "assistant", content: data.message }])
            setAiLoadingState(false)
            setConversationId(data.conversation_id)

            const localConvoId = data.conversation_id

            // Backend tries to get preferences
            if (therapists.length === 0) {
                try {
                    const preferencesResponse = await fetch("/api/chat/extract-preferences", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            conversation_id: localConvoId
                        })
                    })

                    const preferenceData = await preferencesResponse.json()
                    setUserPreferences(preferenceData)
                    localStorage.setItem("userPreferences", JSON.stringify(preferenceData))

                    // Find therapist if the required info from preference data is defined
                    if (preferenceData.insurance && preferenceData.therapy_type &&
                        preferenceData.concerns.length > 0 && therapists.length === 0) {

                        try {
                            setTherapistLoadingState(true)
                            setTherapistFailureMessage("")
                            const therapistsResponse = await fetch("/api/therapists/search", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(preferenceData)
                            })

                            // Retrieves therapist list
                            const therapistsData = await therapistsResponse.json()
                            localTherapists = therapistsData.results.map((item: any) => item.therapist)
                            localStorage.setItem("therapists", JSON.stringify(therapistsData.results.map((item: any) => item.therapist)))
                            setTherapists(localTherapists)
                            
                            // Handles no therapist accepting users insurance
                            if (therapistsData.insurance_fallback) {
                                setInsuranceFallback({ active: true, insurance: therapistsData.insurance })
                            }
                            setMessages(prev => [...prev, { role: "assistant", content: "We found some matches" }])
                        } catch {
                            setTherapistFailureMessage("Unable to show therapists")
                        } finally {
                            setTherapistLoadingState(false)
                        }
                    }
                } catch {
                    setTherapistFailureMessage("Unable to load therapist recommendations")
                }
            }
        } catch (error) {
            console.log(error)
            setChatFailureMessage("Chatbot Disconnected")
        } finally {
            setAiLoadingState(false)
            setTimeout(() => inputRef.current?.focus(), 0)
        }
    }

    return (
        <>
            <div className="bg-surface border border-line rounded-[14px] p-8 max-w-2xl mx-auto relative">
                <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-full bg-accent-bg text-accent-dark text-xs w-fit">
                    <Clock size={13} className="shrink-0 mt-0.5" />
                    <span>This is a demo project hosted on free infrastructure. First load can take up to a minute while the server wakes up. </span>
                </div>
                {/* Reset button */}
                <button className="flex items-center gap-1.5 mb-6 text-xs text-ink-soft hover:text-ink transition-colors" type="button" onClick={resetAll} aria-label="Start a new chat" title="Start a new chat">
                    <RefreshCw size={13} />
                    <span>Start over</span>
                </button>
                <div className="mt-6 mb-2">
                    {messages.map((msg, idx) => {
                        if (msg.role === "user") {
                            return (
                                <div key={idx} style={{ background: '#EFEDE4', color: 'var(--ink)', borderRadius: 14, borderBottomRightRadius: 4, padding: '14px 18px', fontSize: 14, maxWidth: '82%', marginLeft: 'auto', marginBottom: 10, textAlign: 'left' }}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            )
                        }
                        if (msg.role === "system") {
                            return (
                                <div key={idx} style={{ background: '#FBF3DD', color: '#7A5B14', borderRadius: 14, padding: '14px 18px', fontSize: 14, marginBottom: 10 }}>
                                    {msg.content}
                                </div>
                            )
                        }
                        return (
                            <div key={idx} style={{ background: 'var(--accent-bg)', color: 'var(--accent-dark)', borderRadius: 14, borderBottomLeftRadius: 4, padding: '14px 18px', fontSize: 14, maxWidth: '82%', marginRight: 'auto', marginBottom: 10, textAlign: 'left' }}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                    {/* Loading vars to tell users to wait. Something is happening in backend  */}
                    {isAiLoading && !isTherapistLoading && (
                        <div style={{ background: 'var(--accent-bg)', color: 'var(--accent-dark)', borderRadius: 14, borderBottomLeftRadius: 4, padding: '14px 18px', fontSize: 20, maxWidth: '82%', marginRight: 'auto', marginBottom: 10, display: 'flex', gap: 2 }}>
                            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                        </div>
                    )}
                    {chatFailureMessage.length > 0 && (
                        <div style={{ background: '#FBF3DD', color: '#7A5B14', borderRadius: 14, padding: '14px 18px', fontSize: 14, marginBottom: 10 }}>{chatFailureMessage}</div>
                    )}
                </div>
                {isTherapistLoading && (
                    <div style={{ background: 'var(--accent-bg)', color: 'var(--accent-dark)', borderRadius: 14, borderBottomLeftRadius: 4, padding: '14px 18px', fontSize: 20, maxWidth: '82%', marginRight: 'auto', marginBottom: 10, display: 'flex', gap: 2 }}>
                            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                        </div>
                )}
                {therapistFailureMessage.length > 0 && (
                    <div style={{ background: '#FBF3DD', color: '#7A5B14', borderRadius: 14, padding: '14px 18px', fontSize: 14, marginBottom: 10 }}>{therapistFailureMessage}</div>
                )}
                {!isTherapistLoading && therapists.length > 0 && (
                    <div className="mt-6">
                        {/* Handles no therapist with user insurance */}
                        {insuranceFallback.active && (
                            <div className="mb-4" style={{ background: '#FBF3DD', color: '#7A5B14', borderRadius: 14, padding: '14px 18px', fontSize: 14 }}>
                                We couldn&apos;t find therapists who accept <span className="font-semibold">{insuranceFallback.insurance}</span>. Showing therapists who may accept other insurance or self-pay.
                            </div>
                        )}
                        <p className="text-ink font-medium mb-3 text-sm">
                            Here are some therapists we think will be a great match for you
                        </p>

                        <div className="relative px-12">
                            {/* Therapist Card holds therapist info */}
                            <TherapistCard
                                therapist={therapists[currentIndex]}
                                userInsurance={userPreferences?.insurance || ""}
                                onReachOut={() => handleReachOut(therapists[currentIndex])}
                                emailSent={emailSent}
                                consultationQuestions={consultationQuestions}
                            />
                            {/* Carousel to click through the available therapist */}
                            {currentIndex > 0 ? (
                                <button onClick={goPrev} className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-line flex items-center justify-center text-ink-soft bg-surface hover:bg-accent-bg hover:text-accent-dark hover:border-accent-bg transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                            ) : <div />}
                            {currentIndex < therapists.length - 1 ? (
                                <button onClick={goNext} className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-line flex items-center justify-center text-ink-soft bg-surface hover:bg-accent-bg hover:text-accent-dark hover:border-accent-bg transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                            ) : <div />}
                        </div>

                        <div className="flex justify-center gap-1.5 mt-4 mb-5">
                            {therapists.map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? "bg-accent" : "bg-line"}`} />
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {therapists.slice(currentIndex + 1, currentIndex + 3).map((t, idx) => (
                                <button key={idx} onClick={() => setCurrentIndex(currentIndex + 1 + idx)} className="bg-surface border border-line rounded-xl p-3 opacity-60 hover:opacity-100 transition-opacity text-left">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-accent-bg flex items-center justify-center text-accent-dark text-xs font-medium shrink-0">
                                            {t.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-ink">{t.name}</p>
                                            <p className="text-xs text-ink-soft">{t.specialty?.slice(0, 2).join(", ")}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex gap-2 mt-4">
                    <input
                        ref={inputRef}
                        className="flex-1 rounded-lg border border-[#E1DCCE] bg-[#FBFAF6] px-3.5 py-3
                                    text-sm text-[#202B27] placeholder:text-[#96968C]
                                    focus:outline-none focus:ring-2 focus:ring-[#3F6653]/30"
                        placeholder="Describe your therapy needs..."
                        type="text"
                        value={inputText}
                        disabled={isAiLoading || isRecording || isTherapistLoading}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") sendMessage() }}
                    />
                    <button
                        className={`flex w-11 items-center justify-center rounded-lg border transition-colors
                          ${isRecording
                            ? 'border-[#3F6653] bg-[#E4EAE0] text-[#2A4739]'
                            : 'border-[#E1DCCE] bg-[#FBFAF6] text-[#5C6B64] hover:border-[#3F6653] hover:bg-[#E4EAE0] hover:text-[#2A4739]'
                          }`}
                        onClick={toggleRecording}
                    >
                        <Mic size={18} />
                    </button>                  
                    <button className="rounded-lg bg-[#3F6653] px-5 text-sm font-medium text-white
                   transition-colors hover:bg-[#2A4739]"
                        onClick={() => { sendMessage() }}
                        disabled={isAiLoading || isRecording || isTherapistLoading}
                    >
                        Send
                    </button>
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-start pt-10 justify-center z-50">
                    <div className="bg-surface border border-line rounded-[14px] p-6 max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col overflow-y-auto">

                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-display font-medium text-ink text-lg">Reach out to {selectedTherapist?.name}</h2>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-ink-soft hover:bg-accent-bg hover:text-accent-dark transition-colors">✕</button>
                        </div>

                        {/* Contact info page */}
                        <div className="mb-4">
                            <p className="text-xs font-medium text-ink-soft mb-1.5">Your name</p>
                            <input value={userName} onChange={(e) => setUserName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-bg border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:border-accent transition-colors" />
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {emailFailureMessage.length > 0 && (
                                <div className="mb-3" style={{ background: '#FBF3DD', color: '#7A5B14', borderRadius: 10, padding: '12px 16px', fontSize: 13 }}>{emailFailureMessage}</div>
                            )}
                            {isEmailLoading || !emailDraft ? (
                                <p className="text-sm text-ink-soft text-center py-6">Generating email draft…</p>
                            ) : (
                                <>
                                    <p className="text-xs font-medium text-ink-soft mb-1.5">Subject</p>
                                    <p className="text-sm text-ink bg-bg border border-line px-3 py-2.5 rounded-lg mb-4">{emailDraft.email_subject}</p>
                                    <p className="text-xs font-medium text-ink-soft mb-1.5">Message</p>
                                    <textarea
                                        value={emailDraft.email_body}
                                        onChange={(e) => setEmailDraft({ ...emailDraft, email_body: e.target.value })}
                                        className="w-full text-sm text-ink bg-bg border border-line px-3 py-2.5 rounded-lg h-80 resize-none focus:outline-none focus:border-accent transition-colors"
                                    />
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                const mailtoLink = `mailto:?subject=${encodeURIComponent(emailDraft?.email_subject || "")}&body=${encodeURIComponent(emailDraft?.email_body || "")}`
                                window.open(mailtoLink)
                                fetch("/api/outreach", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ user_id: userId, therapist_id: selectedTherapist?.id })
                                }).catch(() => {})
                                setEmailSent(true)
                                setConsultationQuestions(emailDraft?.talking_points ?? [])
                                setTimeout(() => setShowModal(false), 1200)
                            }}
                            disabled={!emailDraft || isEmailLoading || emailSent}
                            className={`mt-5 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                emailSent
                                    ? 'bg-[#3F6653] text-white cursor-default'
                                    : 'bg-accent text-white hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed'
                            }`}>
                            {emailSent ? '✓ Email sent' : 'Send email'}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
} 