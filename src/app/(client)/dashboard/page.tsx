'use client'

import Link from 'next/link'

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

// Dados mock — em produção virão do Supabase
const mockProcess = {
  id: 'mock-id',
  package: 'Pro+',
  maxApplicants: 3,
  status: 'consular_fee_paid' as ProcessStatus,
  applicants: [
    { id: '1', label: 'Solicitante Principal', given_name: 'João', surname: 'Silva', form_step: 8, form_completed_at: '2024-01-15' },
    { id: '2', label: 'Cônjuge', given_name: 'Maria', surname: 'Silva', form_step: 3, form_completed_at: null },
    { id: '3', label: 'Filho', given_name: null, surname: null, form_step: 0, form_completed_at: null },
  ],
  consulting_paid_at: '2024-01-10',
}

function getStepIndex(status: ProcessStatus): number {
  return STEP_ORDER.indexOf(status)
}

export default function DashboardPage() {
  const process = mockProcess
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
            Solicitantes ({process.applicants.length}/{process.maxApplicants})
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
          { label: 'Formulário', href: '/formulario', icon: '📝' },
          { label: 'Taxa consular', href: '/taxa-consular', icon: '💵' },
          { label: 'Agendamento', href: '/agendamento', icon: '📅' },
          { label: 'Documentos', href: '/documentos', icon: '📄' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <p className="text-sm font-semibold text-slate-700">{action.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
