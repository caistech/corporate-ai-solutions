'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Mic, MicOff, X, MessageCircle } from 'lucide-react'
import { getAgentForPage, generateSessionId } from '@/lib/elevenlabs'
import { VOICE_AGENTS, DEFAULT_AGENT, PLATFORMS } from '@/lib/constants'

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

export function VoiceAgent() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState<Message[]>([])
  const [sessionId] = useState(() => generateSessionId())
  const [startTime, setStartTime] = useState<number | null>(null)
  const pathname = usePathname()
  
  const agentKey = getAgentForPage(pathname)
  const agent = VOICE_AGENTS[agentKey] || VOICE_AGENTS[DEFAULT_AGENT]
  
  // Save conversation to database
  const saveConversation = useCallback(async (outcome: string = 'completed') => {
    if (transcript.length <= 1) return // Don't save if only greeting
    if (!startTime) return
    
    try {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000)
      
      await fetch('/api/voice/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          agent_name: agent?.name || 'Unknown',
          page_path: pathname,
          messages: transcript,
          duration_seconds: durationSeconds,
          outcome,
          lead_captured: false,
        }),
      })
    } catch (error) {
      console.error('Failed to save conversation:', error)
    }
  }, [transcript, sessionId, agent?.name, pathname, startTime])

  // Save conversation when window closes or navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (transcript.length > 1 && startTime) {
        navigator.sendBeacon('/api/voice/conversations', JSON.stringify({
          session_id: sessionId,
          agent_name: agent?.name || 'Unknown',
          page_path: pathname,
          messages: transcript,
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          outcome: 'abandoned',
          lead_captured: false,
        }))
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [transcript, sessionId, agent?.name, pathname, startTime])

  const handleClose = () => {
    saveConversation('completed')
    setIsOpen(false)
    setTranscript([])
    setStartTime(null)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setStartTime(Date.now())
  }

  useEffect(() => {
    if (isOpen && transcript.length === 0 && agent) {
      const greeting: Message = { 
        role: 'agent', 
        content: agent.greeting,
        timestamp: Date.now()
      }
      setTranscript([greeting])
      setIsSpeaking(true)
      setTimeout(() => setIsSpeaking(false), 3000)
    }
  }, [isOpen, agent, transcript.length])

  const toggleListening = () => {
    setIsListening(!isListening)
    // TODO: Integrate with ElevenLabs Conversational AI SDK
  }

  const addUserMessage = (content: string) => {
    const userMsg: Message = { role: 'user', content, timestamp: Date.now() }
    setTranscript(prev => [...prev, userMsg])
    
    setIsSpeaking(true)
    setTimeout(() => {
      const responses: Record<string, string> = {
        'What do you offer?': `Three ways in. An Opportunity Audit is two and a half thousand plus GST for one week — Dennis maps the process, costs the automation targets, and you get a working prototype, not a slide deck. A Deployment Sprint is eighteen thousand plus GST for three weeks, fixed scope, production-ready, and you own the code outright with no licence and no lock-in. Run and Extend is three and a half thousand a month plus GST if you want him to keep building, cancellable any month. There are also ${PLATFORMS.length} BYOK products in the marketplace, free on your own keys. Which sounds like your shape?`,
        'How does pricing work?': "Fixed price, fixed scope, fixed end date — an overrun is his, not yours. The Opportunity Audit is two and a half thousand plus GST for a week, and it is credited in full against a Sprint booked within thirty days. The Deployment Sprint is eighteen thousand plus GST for three weeks, half on signature and half on delivery. Run and Extend is three and a half thousand a month plus GST, cancel any month without penalty. What he does not do is day rates, staff augmentation, or open-ended retainers with no deliverable. What are you trying to solve?",
        'What happens in the audit?': "One week. Dennis maps how the process actually runs today, costs the parts worth automating, and builds a working prototype of the piece that matters — something you can click, not a recommendation. Two and a half thousand plus GST, credited in full against a Sprint if you book one within thirty days. If the audit finds it is not worth building, it tells you that in week one, and he would rather it did. What process is eating your team's time?",
      }

      const agentMsg: Message = {
        role: 'agent',
        content: responses[content] || "Good question — tell me a bit more about what you're trying to solve. Is there a process eating a couple of days a week, like quoting, compliance paperwork, intake or reporting? That is usually where the audit starts.",
        timestamp: Date.now()
      }
      setTranscript(prev => [...prev, agentMsg])
      setIsSpeaking(false)
    }, 1500)
  }

  if (!agent) return null

  // Suppress the marketing voice agent on the operator cockpit (/admin/*): that surface ships
  // the in-context Methodology clarifier (CockpitClarifier), and two competing voice buttons is
  // confusing. This is the global marketing agent; the clarifier is the cockpit's voice surface.
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      {/* Floating button - show avatar if agent has one */}
      {agent.avatar ? (
        <button
          onClick={handleOpen}
          className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen ? 'scale-0' : 'scale-100'
          } shadow-lg hover:shadow-accent/20 ring-2 ring-accent ring-offset-2 ring-offset-black overflow-hidden`}
          aria-label={`Talk to ${agent.name}`}
        >
          <img 
            src={agent.avatar} 
            alt={agent.name}
            className="w-full h-full object-cover"
          />
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen ? 'scale-0' : 'scale-100'
          } bg-accent hover:bg-white text-black shadow-lg hover:shadow-accent/20`}
          aria-label="Open voice assistant"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-gray-dark border border-gray-border shadow-2xl rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-border bg-black/20">
            <div className="flex items-center gap-3">
              {agent.avatar ? (
                <div className={`relative ${isSpeaking ? 'ring-2 ring-accent ring-offset-2 ring-offset-gray-dark' : ''}`}>
                  <img 
                    src={agent.avatar} 
                    alt={agent.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isSpeaking && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse" />
                  )}
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSpeaking ? 'bg-accent animate-pulse' : 'bg-gray-mid'
                }`}>
                  <Mic size={18} className={isSpeaking ? 'text-black' : 'text-white'} />
                </div>
              )}
              <div>
                <p className="font-bold text-sm">{agent.name}</p>
                <p className="text-xs text-gray-light">{agent.personality}</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="text-gray-light hover:text-white transition-colors"
              aria-label="Close voice assistant"
            >
              <X size={20} />
            </button>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-4">
            {transcript.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 text-sm rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-accent text-black' 
                    : 'bg-gray-mid text-white'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isListening && (
              <div className="flex justify-end">
                <div className="bg-accent/20 text-accent p-3 text-sm rounded-lg animate-pulse">
                  Listening...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-border">
            <div className="flex items-center justify-center">
              <button
                onClick={toggleListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-accent hover:bg-white'
                } text-black`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            </div>
            <p className="text-center text-xs text-gray-light mt-3">
              {isListening ? 'Tap to stop' : 'Tap to speak'}
            </p>
          </div>

          <div className="p-4 border-t border-gray-border bg-black/10">
            <p className="text-xs text-gray-light mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {['What do you offer?', 'How does pricing work?', 'What happens in the audit?'].map((q) => (
                <button
                  key={q}
                  onClick={() => addUserMessage(q)}
                  disabled={isSpeaking}
                  className="text-xs bg-gray-mid px-3 py-1.5 text-gray-light hover:text-white hover:bg-gray-mid/80 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
