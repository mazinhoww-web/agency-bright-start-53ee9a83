'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ProcessStatus =
  | 'pending_form'
  | 'form_completed'
  | 'consular_fee_paid'
  | 'appointment_requested'
  | 'docs_in_preparation'
  | 'docs_ready'
  | 'completed'

const STATUS_CONFIG: Record<ProcessStatus, { label: string; color: string; bg: string; description: string }> = {
  pending_form: { label: 'Formulário pendente', color: 'text-amber-700', bg: 'bg-amber-50', description: 'Preencha seus dados para iniciarmos o processo.' },
  form_completed: { label: 'Formulário enviado', color: 'text-blue-700', bg: 'bg-blue-50', description: 'Nossa consultora está revisando seu formulário.' },
  consular_fee_paid: { label: 'Taxa paga', color: 'text-blue-700', bg: 'bg-blue-50', description: 'Agora informe suas datas para agendamento.' },
  appointment_requested: { label: 'Agendamento solicitado', color: 'text-purple-700', bg: 'bg-purple-50', description: 'Aguardando confirmação de datas disponíveis.' },
  docs_in_preparation: { label: 'Preparando documentos', color: 'text-indigo-700', bg: 'bg-indigo-50', description: 'Sua documentação está sendo preparada.' },
  docs_ready: { label: 'Documentos prontos', color: 'text-green-700', bg: 'bg-green-50', description: 'Seus documentos estão disponíveis para download.' },
  completed: { label: 'Processo concluído', color: 'text-green-700', bg: 'bg-green-50', description: 'Parabéns! Toda a documentação foi entregue.' },
}

const PROCESS_STEPS: { key: ProcessStatus; label: string }[] = [
  { key: 'pending_form', label: 'Formulário DS-160' },
  { key: 'consular_fee_paid', label: 'Taxa Consular' },
  { key: 'appointment_requested', label: 'Agendamento' },
  { key: 'docs_in_preparation', label: 'Documentação' },
  { key: 'completed', label: 'Concluído' },
]

const STEP_ORDER: ProcessStatus[] = [
  'pending_form', 'form_completed', 'consular_fee_paid',
  'appointment_requested', 'docs_in_preparation', 'docs_ready', 'completed'
]

type Applicant = {
  id: string
  label: string
  given_name: string | null
  surname: string | null
  form_step: number
  form_completed_at: string | null
}

type Process = {
  id: string
  package: string
  max_applicants: number
  status: ProcessStatus
  applicants: Applicant[]
}

function getStepIndex(status: ProcessStatus): number {
  return STEP_ORDER.indexOf(status)
}

export default function DashboardPage() {
  const [process, setProcess] = useState<Process | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProcess = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setError('Usuário não autenticado')
          setLoading(false)
          return
        }

        const { data, error: processError } = await supabase
          .from('processes')
          .select('*, applicants(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (processError || !data) {
          setError('Nenhum processo encontrado')
          setLoading(false)
          return
        }

        setProcess(data as Process)
      } catch (err) {
        console.error('Error fetching process:', err)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    fetchProcess()
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Carregando seu processo...</p>
        </div>
      </div>
    )
  }

  if (error || !process) {
    return (
      <div className="p-6 lg:p-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhum processo encontrado</h2>
          <p className="text-slate-600">{error || 'Entre em contato com nossa consultora para iniciar seu processo.'}</p>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[process.status]
  const currentStepIndex = getStepIndex(process.status)

  const nextAction = {
    pending_form: { label: 'Preencher formulário', href: '/formulario' },
    form_completed: null,
    consular_fee_paid: { label: 'Solicitar agendamento', href: '/agendamento' },
    appointment_requested: null,
    docs_in_preparation: null,
    docs_ready: { label: 'Baixar documentos', href: '/documentos' },
    completed: { label: 'Ver documentos', href: '/documentos' },
  }[process.status]

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Meu processo</h1>
        <p className="text-slate-600">Acompanhe o andamento do seu visto americano</p>
      </div>

      {/* Status Card */}
      <div className={`${statusConfig.bg} rounded-2xl p-6 mb-8 border border-slate-200`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 ${statusConfig.color} font-semibold text-sm mb-2`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {statusConfig.label}
            </div>
            <p className="text-slate-700">{statusConfig.description}</p>
          </div>
          {nextAction && (
            <Link
              href={nextAction.href}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              {nextAction.label} →
            </Link>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <h2 className="font-bold text-slate-900 mb-6">Progresso do processo</h2>
        <div className="relative">
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200" />
          <div className="space-y-6">
            {PROCESS_STEPS.map((step, index) => {
              const stepStatusIndex = getStepIndex(step.key)
              const isDone = currentStepIndex > stepStatusIndex
              const isCurrent = step.key === process.status ||
                (step.key === 'form_completed' && process.status === 'form_completed') ||
                (step.key === 'consular_fee_paid' && process.status === 'consular_fee_paid')
              const isPending = !isDone && !isCurrent

              return (
                <div key={step.key} className="flex items-center gap-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                    isDone ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-blue-700 text-white' :
                    'bg-white border-2 border-slate-200 text-slate-400'
                  }`}>
                    {isDone ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className={`font-semibold ${isPending ? 'text-slate-400' : 'text-slate-900'}`}>
                      {step.label}
                    </p>
                    {isDone && <p className="text-xs text-green-600">Concluído</p>}
                    {isCurrent && <p className="text-xs text-blue-600">Em andamento</p>}
                    {isPending && <p className="text-xs text-slate-400">Pendente</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Solicitantes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-slate-900">
            Solicitantes ({process.applicants.length}/{process.max_applicants})
          </h2>
          <Link href="/formulario" className="text-sm text-blue-700 font-semibold hover:underline">
            Preencher formulários →
          </Link>
        </div>
        <div className="space-y-3">
          {process.applicants.map((applicant) => {
            const name = applicant.given_name && applicant.surname
              ? `${applicant.given_name} ${applicant.surname}`
              : applicant.label
            const progress = Math.round((applicant.form_step / 10) * 100)

            return (
              <div key={applicant.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-sm">
                    {(applicant.given_name?.[0] || applicant.label[0]).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{name}</p>
                  <p className="text-xs text-slate-500">{applicant.label}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 flex-shrink-0">{progress}%</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {applicant.form_completed_at ? (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                      Completo
                    </span>
                  ) : (
                    <Link
                      href={`/formulario?applicant=${applicant.id}`}
                      className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Preencher
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Formulário',
            href: '/formulario',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
          },
          {
            label: 'Taxa consular',
            href: '/taxa-consular',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: 'Agendamento',
            href: '/agendamento',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
          },
          {
            label: 'Documentos',
            href: '/documentos',
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ),
          },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 hover:shadow-sm transition-colors min-h-[88px] flex flex-col items-center justify-center gap-2"
            aria-label={action.label}
          >
            <div className="text-blue-600">{action.icon}</div>
            <p className="text-sm font-semibold text-slate-700">{action.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
