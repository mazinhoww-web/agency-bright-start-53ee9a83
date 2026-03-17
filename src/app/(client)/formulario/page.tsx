'use client'

import { useState } from 'react'
import Link from 'next/link'

const FORM_STEPS = [
  { id: 1, title: 'Dados pessoais', description: 'Nome, data de nascimento, estado civil' },
  { id: 2, title: 'Informações de contato', description: 'Endereço, telefone, e-mail' },
  { id: 3, title: 'Passaporte', description: 'Tipo, número, validade' },
  { id: 4, title: 'Viagem', description: 'Propósito, datas, endereço nos EUA' },
  { id: 5, title: 'Situação profissional', description: 'Emprego, renda, educação' },
  { id: 6, title: 'Família', description: 'Pais, cônjuge, filhos' },
  { id: 7, title: 'Viagens anteriores', description: 'Histórico de viagens e vistos' },
  { id: 8, title: 'Questões de segurança', description: 'Perguntas obrigatórias do DS-160' },
]

export default function FormularioPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const progress = ((currentStep - 1) / (FORM_STEPS.length - 1)) * 100

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900">Formulário DS-160</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Formulário DS-160</h1>
        <p className="text-slate-600">Preencha com calma — você pode salvar e continuar depois.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Steps Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Etapas</p>
            <nav className="space-y-1">
              {FORM_STEPS.map((step) => {
                const isDone = step.id < currentStep
                const isCurrent = step.id === currentStep
                return (
                  <button
                    key={step.id}
                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                      isCurrent ? 'bg-blue-50 text-blue-700' :
                      isDone ? 'text-green-700 hover:bg-green-50' :
                      'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isDone ? 'bg-green-600 text-white' :
                      isCurrent ? 'bg-blue-700 text-white' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isDone ? '✓' : step.id}
                    </div>
                    <span className="font-medium truncate">{step.title}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3">
          {/* Progress Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">
                Etapa {currentStep} de {FORM_STEPS.length}: {FORM_STEPS[currentStep - 1].title}
              </span>
              <span className="text-sm text-slate-500">{Math.round(progress)}% completo</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">{FORM_STEPS[currentStep - 1].description}</p>
          </div>

          {/* Dynamic Step Content */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Dados pessoais</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sobrenome (como no passaporte) *</label>
                    <input
                      type="text"
                      value={formData.surname || ''}
                      onChange={(e) => updateField('surname', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                      placeholder="SILVA"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome(s) (como no passaporte) *</label>
                    <input
                      type="text"
                      value={formData.given_name || ''}
                      onChange={(e) => updateField('given_name', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                      placeholder="JOAO CARLOS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data de nascimento *</label>
                    <input
                      type="date"
                      value={formData.birth_date || ''}
                      onChange={(e) => updateField('birth_date', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Sexo *</label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => updateField('gender', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estado civil *</label>
                    <select
                      value={formData.marital_status || ''}
                      onChange={(e) => updateField('marital_status', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                    >
                      <option value="">Selecione</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao_estavel">União estável</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">País de nascimento *</label>
                    <input
                      type="text"
                      value={formData.birth_country || ''}
                      onChange={(e) => updateField('birth_country', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                      placeholder="Brasil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Cidade de nascimento *</label>
                    <input
                      type="text"
                      value={formData.birth_city || ''}
                      onChange={(e) => updateField('birth_city', e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                      placeholder="São Paulo"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep !== 1 && (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4" aria-hidden="true">
                  <svg className="w-12 h-12 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{FORM_STEPS[currentStep - 1].title}</h2>
                <p className="text-slate-600 mb-4">{FORM_STEPS[currentStep - 1].description}</p>
                <p className="text-sm text-slate-400">Esta etapa será implementada na fase seguinte.</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
                className="flex-1 border-2 border-slate-200 hover:border-slate-300 disabled:opacity-40 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => {
                  if (currentStep < FORM_STEPS.length) {
                    setCurrentStep(currentStep + 1)
                  }
                }}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {currentStep === FORM_STEPS.length ? 'Salvar e finalizar ✓' : 'Próxima etapa →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
