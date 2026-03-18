'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  process_id: string
  sender_id: string
  sender_type: 'client' | 'admin'
  content: string
  is_read: boolean
  created_at: string
}

export default function MensagensPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [processId, setProcessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Buscar processo do usuário
      const { data: process } = await supabase
        .from('processes')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (process) {
        setProcessId(process.id)
        fetchMessages(process.id)
      } else {
        setLoading(false)
      }
    }

    init()
  }, [])

  // Polling a cada 5 segundos
  useEffect(() => {
    if (!processId) return
    const interval = setInterval(() => fetchMessages(processId), 5000)
    return () => clearInterval(interval)
  }, [processId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async (pid: string) => {
    const res = await fetch(`/api/messages?processId=${pid}`)
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
    setLoading(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!processId || !content.trim()) return
    setSending(true)

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processId, content, senderType: 'client' }),
    })

    setContent('')
    setSending(false)
    fetchMessages(processId)
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-64">
        <p className="text-slate-500">Carregando...</p>
      </div>
    )
  }

  if (!processId) {
    return (
      <div className="p-6 lg:p-10">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-amber-800 font-semibold">Nenhum processo encontrado.</p>
          <p className="text-amber-700 text-sm mt-1">Entre em contato pelo WhatsApp para iniciar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 flex flex-col h-[calc(100vh-2rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mensagens</h1>
        <p className="text-slate-600 mt-1">Comunicação direta com nossa equipe</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">CV</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Cia do Visto</p>
            <p className="text-xs text-green-600">Consultora disponível</p>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm mt-8">
              <p>Nenhuma mensagem ainda.</p>
              <p className="mt-1">Envie uma mensagem para nossa equipe!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_type === 'client'
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-blue-700 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-slate-400 px-1">
                      {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(msg.created_at))}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
            >
              {sending ? '...' : 'Enviar'}
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            Respondemos em horário comercial. Para urgências, use o WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}
