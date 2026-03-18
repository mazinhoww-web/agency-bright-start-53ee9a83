'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CONSULADOS, CASVS } from '@/config/locations'

export default function AgendamentoPage() {
  const [casvCity, setCasvCity] = useState('')
  const [consulateCity, setConsulateCity] = useState('')
  const [casvDate, setCasvDate] = useState('')
  const [consulateDate, setConsulateDate] = useState('')
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [processId, setProcessId] = useState<string | null>(null)

  useEffect(() => {
    const loadProcess = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: process } = await supabase
        .from('processes')
        .select('id, casv_city, casv_intended_date, consulate_city, consulate_intended_date, appointment_disclaimer_accepted_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (process) {
        setProcessId(process.id)
        if (process.casv_city) setCasvCity(process.casv_city)
        if (process.casv_intended_date) setCasvDate(process.casv_intended_date)
        if (process.consulate_city) setConsulateCity(process.consulate_city)
        if (process.consulate_intended_date) setConsulateDate(process.consulate_intended_date)
        if (process.appointment_disclaimer_accepted_at) setSubmitted(true)
      }
    }

    loadProcess()
  }, [])

  const canSubmit = casvCity && consulateCity && casvDate && consulateDate && disclaimerAccepted

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSaving(true)
    setSaveError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      let pid = processId
      if (!pid) {
        const { data: process } = await supabase
          .from('processes')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (!process) throw new Error('Processo não encontrado')
        pid = process.id
      }

      const { error } = await supabase
        .from('processes')
        .update({
          casv_city: casvCity,
          casv_intended_date: casvDate,
          consulate_city: consulateCity,
          consulate_intended_date: consulateDate,
          appointment_disclaimer_accepted_at: new Date().toISOString(),
        })
        .eq('id', pid)

      if (error) throw error

      setSubmitted(true)
    } catch (err) {
      console.error('Error saving agendamento:', err)
      setSaveError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-6 lg:p-10 max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Solicitação enviada!</h2>
          <p className="text-slate-600 mb-2">
            Suas preferências de datas foram registradas. Nossa consultora irá verificar a disponibilidade e entrar em contato via WhatsApp.
          </p>
          <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3 mb-6">
            Lembrete: as datas informadas são apenas uma intenção — não garantimos disponibilidade real.
          </p>
          <Link href="/dashboard" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl transition-colors inline-block">
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900">Agendamento</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Solicitação de Agendamento</h1>
        <p className="text-slate-600">Informe suas preferências para o CASV e consulado.</p>
      </div>

      {saveError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {saveError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CASV */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-1">CASV (Coleta de biometria)</h2>
          <p className="text-sm text-slate-500 mb-5">Centro de Solicitações de Visto Americano</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cidade preferida *</label>
              <select
                value={casvCity}
                onChange={(e) => setCasvCity(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
              >
                <option value="">Selecione uma cidade</option>
                {CASVS.map((c) => (
                  <option key={c.id} value={c.city}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data preferida *</label>
              <input
                type="date"
                value={casvDate}
                onChange={(e) => setCasvDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Consulado */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-1">Consulado (Entrevista)</h2>
          <p className="text-sm text-slate-500 mb-5">Local da entrevista com o oficial consular</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cidade preferida *</label>
              <select
                value={consulateCity}
                onChange={(e) => setConsulateCity(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
              >
                <option value="">Selecione uma cidade</option>
                {CONSULADOS.map((c) => (
                  <option key={c.id} value={c.city}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data preferida *</label>
              <input
                type="date"
                value={consulateDate}
                onChange={(e) => setConsulateDate(e.target.value)}
                min={casvDate || new Date().toISOString().split('T')[0]}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              className="mt-1 accent-blue-700"
            />
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Declaro que entendo:</strong> as datas informadas são apenas uma preferência. A Cia do Visto irá verificar a disponibilidade real e confirmar as datas via WhatsApp. O agendamento definitivo depende da disponibilidade do consulado americano.
            </p>
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-lg"
        >
          {saving ? 'Salvando...' : 'Enviar solicitação →'}
        </button>
      </form>
    </div>
  )
}
