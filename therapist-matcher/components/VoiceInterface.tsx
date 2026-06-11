"use client"

import { useState, useRef } from 'react'
import { Mic, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import TherapistCard from '@/components/TherapistCard'
import ReactMarkdown from 'react-markdown'


function getUserId() {
    if (typeof window === "undefined") return ""

    let userId = localStorage.getItem("user_id")
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userPreferences, setPreferences] = useState<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [therapists, setTherapists] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [emailDraft, setEmailDraft] = useState<{ email_subject: string, email_body: string, talking_points: string[] } | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedTherapist, setSelectedTherapist] = useState<any>(null)
    const [userName, setUserName] = useState("")
    const [isAiLoading, setAiLoadingState] = useState(false)
    const [isTherapistLoading, setTherapistLoadingState] = useState(false)
    const [isEmailLoading, setEmailLoadingState] = useState(false)
    const [emailFailureMessage, setEmailFailureMessage] = useState("")
    const [chatFailureMessage, setChatFailureMessage] = useState("")
    const [therapistFailureMessage, setTherapistFailureMessage] = useState("")
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])


    function resetAll() {
        setCurrentIndex(0)
        setConversationId("")
        setMessages([])
        setTherapists([])
        setPreferences(null)
        setChatFailureMessage("")
        setEmailFailureMessage("")
        setTherapistFailureMessage("")
    }

    function goNext() {
        if (currentIndex + 1 < therapists.length) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function handleReachOut(therapist: any) {
        setEmailLoadingState(true)
        setEmailFailureMessage("")

        try {
            setSelectedTherapist(therapist)
            setShowModal(true)

            const response = await fetch("http://localhost:8000/api/email/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    therapist_id: therapist.id,
                    conversation_id: conversationId,
                    user_name: "",
                    user_email: "",
                    user_phone_number: "",
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

    function goPrev() {
        if (currentIndex - 1 >= 0) {
            setCurrentIndex(currentIndex - 1)
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

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorderRef.current = new MediaRecorder(stream)
        audioChunksRef.current = []

        // on each chunk of data, push to audioChunksRef
        mediaRecorderRef.current.ondataavailable = (e) => {
            audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.start()
        setIsRecording(true)
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
        const formData = new FormData()
        formData.append("file", audioBlob, "audio.webm")

        const response = await fetch("http://localhost:8000/api/voice/transcribe", {
            method: "POST",
            body: formData
        })

        // get transcript text from response
        const data = await response.json()
        await sendMessage(data.transcript)
    }

    async function sendMessage(overrideText?: string) {
        const messageText = overrideText || inputText

        if (!messageText) {
            return
        }

        setMessages([...messages, { role: "user", content: messageText }])
        setInputText("")
        setAiLoadingState(true)
        setChatFailureMessage("")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let localTherapists: any[] = []

        try {
            const response = await fetch("http://localhost:8000/api/chat/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_id: conversationId || null,
                    user_id: userId,
                    message: messageText
                })
            })

            const data = await response.json()
            setMessages(prev => [...prev, { role: "assistant", content: data.message }])
            setConversationId(data.conversation_id)
            const localConvoId = data.conversation_id

            if (therapists.length === 0) {
                const preferencesResponse = await fetch("http://localhost:8000/api/chat/extract-preferences", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversation_id: localConvoId
                    })
                })

                const preferenceData = await preferencesResponse.json()
                setPreferences(preferenceData)
                localStorage.setItem("userPreferences", JSON.stringify(preferenceData))

                console.log(preferenceData)

                if (preferenceData.insurance && preferenceData.therapy_type &&
                    preferenceData.concerns.length > 0 && therapists.length === 0) {

                    try {
                        setTherapistLoadingState(true)
                        setTherapistFailureMessage("")
                        const therapistsResponse = await fetch("http://localhost:8000/api/therapists/search", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(preferenceData)
                        })

                        const therapistsData = await therapistsResponse.json()
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        localTherapists = therapistsData.map((item: any) => item.therapist)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        localStorage.setItem("therapists", JSON.stringify(therapistsData.map((item: any) => item.therapist)))
                        setTherapists(localTherapists)
                        setMessages(prev => [...prev, { role: "assistant", content: "We found some matches" }])

                    } catch {
                        setTherapistFailureMessage("Unable to show therapists")
                    } finally {
                        setTherapistLoadingState(false)
                    }
                }
            }
        } catch (error) {
            console.log(error)
            setChatFailureMessage("Chatbot Disconnected")
        } finally {
            setAiLoadingState(false)
        }
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto relative">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900"> Let&apos;s find your perfect therapist</h1>
                <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" type="button" onClick={resetAll}>
                    <RotateCcw size={16}></RotateCcw>
                </button>
                <div className="space-y-4 mt-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`p-4 rounded-lg ${msg.role === "assistant"
                            ? "bg-blue-50 text-blue-900"
                            : "bg-gray-50 text-gray-900"
                            }`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    ))}
                    {isAiLoading && !isTherapistLoading && <div className='text-purple-600 text-2xl'> <span className='animate-bounce' style={{ animationDelay: '0ms' }}>.</span>
                        <span className='animate-bounce' style={{ animationDelay: '150ms' }}>.</span>
                        <span className='animate-bounce' style={{ animationDelay: '300ms' }}>.</span>    </div>}
                    {chatFailureMessage.length > 0 && <div> <span className='text-red-500'>{chatFailureMessage}</span></div>}
                </div>
                {isTherapistLoading && <div className='text-purple-600 text-2xl'> <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className='animate-bounce' style={{ animationDelay: '150ms' }}>.</span>
                    <span className='animate-bounce' style={{ animationDelay: '300ms' }}>.</span>    </div>}
                {therapistFailureMessage.length > 0 && <div> <span className='text-red-500'>{therapistFailureMessage}</span></div>}
                {!isTherapistLoading && therapists.length > 0 && (
                    <div className="mt-8">
                        <p className="text-gray-700 font-medium mb-4">
                            Here are some therapists we think will be a great match for you
                        </p>

                        <div className="relative ">
                            <TherapistCard therapist={therapists[currentIndex]} userInsurance={userPreferences?.insurance || ""} onReachOut={() => handleReachOut(therapists[currentIndex])} />

                            {currentIndex > 0 ? (
                                <button onClick={goPrev} className=" absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500  bg-white shadow-sm hover:bg-gray-50">
                                    <ChevronLeft size={18} />
                                </button>
                            ) : 
                            <div></div>
                            }

                            {currentIndex < therapists.length - 1 ? (
                                <button onClick={goNext} className=" absolute right-0 top-1/2 -translate-y-1/2  w-9 h-9 -mx-3 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 bg-white  shadow-sm hover:bg-gray-50">
                                    <ChevronRight size={18} />
                                </button>
                            ) : 
                            <div></div>
                        }
                        </div>

                        <div className="flex justify-center gap-1 mt-3 mb-6">
                            {therapists.map((_, idx) => (
                                <div key={idx} className={`w-2 h-2 rounded-full ${idx === currentIndex ? "bg-purple-600" : "bg-gray-200"}`} />
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 px-10">
                            {therapists.slice(currentIndex + 1, currentIndex + 3).map((t, idx) => (
                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 opacity-60">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold flex-shrink-0">
                                            {t.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-900">{t.name}</p>
                                            <p className="text-xs text-gray-500">{t.specialty?.slice(0, 2).join(", ")}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex gap-2 mt-4">
                    <input
                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-900"
                        placeholder="Describe your therapy needs..."
                        type="text"
                        value={inputText}
                        disabled={isAiLoading || isRecording}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") sendMessage() }}
                    />
                    <button className={` rounded-lg text-white flex items-center justify-center p-3
                        ${isRecording ? "bg-red-500" : "bg-purple-600 "}`} onClick={toggleRecording}>
                        <Mic size={20}></Mic>
                    </button>
                    <button className="bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 px-3"
                        onClick={() => { sendMessage() }}
                        disabled={isAiLoading || isRecording}
                    >
                        Send
                    </button>
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start pt-10 justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col overflow-y-auto">

                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Reach Out to {selectedTherapist?.name}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        {/* Contact info */}
                        <div className="mb-4">
                            <p className="text-xs font-medium text-gray-500 mb-1">Your name</p>
                            <input value={userName} onChange={(e) => setUserName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full bg-gray-50 border-none outline-none rounded-lg p-3 text-sm text-gray-900" />
                        </div>

                        <div className='overflow-y-auto flex-1'>
                            {emailFailureMessage.length > 0 && <div> <span className='text-red-500'>{emailFailureMessage}</span></div>}
                            {isEmailLoading || !emailDraft ? (
                                <p className="text-sm text-gray-400 text-center">Generating email...</p>
                            ) : (
                                <>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg mb-3">{emailDraft.email_subject}</p>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
                                    <textarea
                                        value={emailDraft.email_body}
                                        onChange={(e) => setEmailDraft({ ...emailDraft, email_body: e.target.value })}
                                        className="w-full text-sm text-gray-900 bg-gray-50 p-3 rounded-lg h-80 resize-none outline-none mb-3"
                                    />
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                const mailtoLink = `mailto:?subject=${encodeURIComponent(emailDraft?.email_subject || "")}&body=${encodeURIComponent(emailDraft?.email_body || "")}`
                                window.open(mailtoLink)

                                // add talking points to chat
                                const emailConfirmation = "You reached out to " + selectedTherapist?.name
                                setMessages(prev => [...prev, { role: "assistant", content: emailConfirmation }])
                                setShowModal(false)
                            }}
                            disabled={!emailDraft || isEmailLoading}
                            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                            Send Email
                        </button>
                    </div>
                </div>
            )}
        </>
    )
} 