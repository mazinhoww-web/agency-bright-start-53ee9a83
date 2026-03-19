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
        .single() as { data: { id: string } | null }

      if (process) {
        setProcessId(process.id)
        fetchMessages(process.id)
      } else {
        setLoading(false)
      }
    }

    init()
  }, [])

  // Supabase Realtime — escuta novas mensagens em tempo real
  useEffect(() => {
    if (!processId) return

    const channel = supabase
      .channel(`messages-client-${processId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `process_id=eq.${processId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Evitar duplicatas (caso a mensagem já tenha sido adicionada otimisticamente)
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999'
    return (
      <div className="p-6 lg:p-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Mensagens</h2>
          <p className="text-slate-600 mb-6 text-sm">
            Sua caixa de mensagens estará disponível após a ativação do seu processo. Por enquanto, entre em contato pelo WhatsApp:
          </p>
          <a
            href={`https://wa.me/${whatsapp}?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20a%20equipe%20Cia%20do%20Visto.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Iniciar conversa no WhatsApp
          </a>
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
          <form onSubmit={handleSend} className="flex gap-3 mb-3">
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Respondemos em horário comercial.</p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999'}?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20meu%20processo%20de%20visto.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Abrir no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
