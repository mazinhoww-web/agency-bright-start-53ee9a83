'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PACKAGES } from '@/config/packages'
import { formatCurrencyFromCents } from '@/utils/currency'

const STEPS = [
  { number: '01', title: 'Escolha seu pacote', description: 'Selecione o plano ideal para você ou sua família e finalize o pagamento com segurança.' },
  { number: '02', title: 'Preencha o formulário', description: 'Acesse o portal e preencha os dados necessários para o DS-160 com nossa orientação passo a passo.' },
  { number: '03', title: 'Taxa consular', description: 'Pague a taxa obrigatória do consulado diretamente pelo nosso portal, com câmbio justo.' },
  { number: '04', title: 'Agendamento', description: 'Informe suas datas preferidas para o CASV e consulado. Nossa equipe confirma e organiza tudo.' },
  { number: '05', title: 'Documentação pronta', description: 'Receba todos os documentos preparados e validados pela nossa consultora especializada.' },
]

const FAQS = [
  { q: 'Quanto tempo leva o processo?', a: 'O processo varia conforme a disponibilidade de datas no consulado. Em média, de 2 a 8 semanas após o pagamento da taxa consular.' },
  { q: 'Vocês garantem a aprovação do visto?', a: 'Nenhuma assessoria pode garantir aprovação, pois a decisão é exclusivamente do consulado americano. Nossa função é maximizar suas chances com uma documentação impecável.' },
  { q: 'O DS-160 é o mesmo formulário para todos?', a: 'Sim, o DS-160 é obrigatório para todos os solicitantes de visto não-imigrante americano, incluindo turismo (B1/B2).' },
  { q: 'Posso adicionar mais de um familiar no mesmo pacote?', a: 'Sim! Os planos Pro+ (até 3 pessoas) e Vip+ (até 6 pessoas) são ideais para casais e famílias.' },
  { q: 'Como funciona o suporte pelo WhatsApp?', a: 'Você terá acesso direto à nossa consultora via WhatsApp durante todo o processo, com tempo de resposta de até 4 horas em dias úteis.' },
]

const TESTIMONIALS = [
  { name: 'Maria Silva', city: 'São Paulo', text: 'Processo todo muito claro e tranquilo. Em menos de 6 semanas estava com o visto em mãos!', rating: 5 },
  { name: 'João e família', city: 'Curitiba', text: 'Contratamos o Vip+ para a família de 4. Tudo organizado, cada detalhe explicado. Recomendo muito.', rating: 5 },
  { name: 'Carla Mendes', city: 'Rio de Janeiro', text: 'Tinha medo do processo mas a consultora me guiou em cada etapa. Aprovada na primeira tentativa!', rating: 5 },
]

export default function LandingPageContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2" aria-label="Cia do Visto — Página inicial">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm" aria-hidden="true">CV</span>
              </div>
              <span className="font-bold text-lg text-slate-900">Cia do Visto</span>
            </Link>
            <div className="hidden md:flex items-center gap-8" role="navigation" aria-label="Menu principal">
              <a href="#como-funciona" className="text-sm text-slate-600 hover:text-blue-700 transition-colors">Como funciona</a>
              <a href="#pacotes" className="text-sm text-slate-600 hover:text-blue-700 transition-colors">Pacotes</a>
              <a href="#depoimentos" className="text-sm text-slate-600 hover:text-blue-700 transition-colors">Depoimentos</a>
              <a href="#faq" className="text-sm text-slate-600 hover:text-blue-700 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-slate-600 hover:text-blue-700 transition-colors min-h-[44px] inline-flex items-center px-2">
                Entrar
              </Link>
              <Link
                href="/checkout"
                className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors min-h-[44px] inline-flex items-center"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white overflow-hidden" aria-label="Apresentação">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0tNiAwaDZ2NmgtNnYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-800/50 border border-blue-600/30 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
              Mais de 500 vistos aprovados em 2024
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Seu visto americano{' '}
              <span className="text-blue-300">com quem entende</span>
            </h1>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl leading-relaxed">
              Assessoria digital completa para vistos B1/B2 de turismo. Preencha o DS-160, pague a taxa consular e acompanhe tudo pelo portal — rápido, seguro e sem burocracia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 font-bold text-lg px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Começar meu visto
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 border-2 border-blue-400/50 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-blue-800/50 transition-all"
              >
                Ver como funciona
              </a>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-10 border-t border-blue-700/50">
            {[
              { value: '500+', label: 'Vistos aprovados' },
              { value: '98%', label: 'Taxa de aprovação' },
              { value: '4.9★', label: 'Avaliação média' },
              { value: '24h', label: 'Suporte WhatsApp' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-blue-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 bg-slate-50" aria-labelledby="como-funciona-title">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wider">Processo simples</span>
            <h2 id="como-funciona-title" className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-4">Como funciona</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Do pagamento à documentação pronta — tudo no portal, com suporte em cada etapa.
            </p>
          </div>
          <ol className="space-y-4" aria-label="Etapas do processo">
            {STEPS.map((step, index) => (
              <li
                key={step.number}
                className="flex gap-6 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg" aria-hidden="true">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block ml-auto text-slate-300" aria-hidden="true">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PACOTES */}
      <section id="pacotes" className="py-24 bg-white" aria-labelledby="pacotes-title">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wider">Planos e preços</span>
            <h2 id="pacotes-title" className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-4">Escolha seu pacote</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Assessoria individual, familiar ou para grupos. Preço justo, processo completo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8" role="list" aria-label="Planos de assessoria">
            {Object.values(PACKAGES).map((pkg) => (
              <article
                key={pkg.id}
                role="listitem"
                className={`relative rounded-2xl p-8 border-2 flex flex-col transition-all hover:shadow-xl ${
                  pkg.highlighted
                    ? 'border-blue-700 bg-blue-700 text-white shadow-lg scale-105'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                {'badge' in pkg && pkg.badge && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                    pkg.highlighted ? 'bg-amber-400 text-amber-900' : 'bg-slate-900 text-white'
                  }`} aria-label={`Destaque: ${pkg.badge}`}>
                    {pkg.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${pkg.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {pkg.name}
                  </h3>
                  <p className={`text-sm ${pkg.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>
                    Até {pkg.maxApplicants} {pkg.maxApplicants === 1 ? 'solicitante' : 'solicitantes'}
                  </p>
                </div>
                <div className="mb-8">
                  <span className={`text-4xl font-bold ${pkg.highlighted ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrencyFromCents(pkg.priceInCents)}
                  </span>
                  <span className={`text-sm ml-1 ${pkg.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>
                    {pkg.maxApplicants > 1 ? `/ até ${pkg.maxApplicants} pessoas` : '/ pessoa'}
                  </span>
                </div>
                <ul className="space-y-3 flex-1 mb-8" aria-label={`Incluído no plano ${pkg.name}`}>
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${pkg.highlighted ? 'text-blue-200' : 'text-blue-600'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm ${pkg.highlighted ? 'text-blue-100' : 'text-slate-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/checkout?package=${pkg.id}`}
                  className={`w-full text-center py-3.5 px-6 rounded-xl font-bold text-sm transition-all ${
                    pkg.highlighted
                      ? 'bg-white text-blue-700 hover:bg-blue-50'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                  }`}
                  aria-label={`Selecionar plano ${pkg.name} por ${formatCurrencyFromCents(pkg.priceInCents)}`}
                >
                  Selecionar {pkg.name}
                </Link>
              </article>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">
            * Taxa consular americana (US$ 185/pessoa) cobrada separadamente no portal após a contratação.
          </p>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-24 bg-slate-50" aria-labelledby="depoimentos-title">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wider">Clientes satisfeitos</span>
            <h2 id="depoimentos-title" className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-4">O que dizem nossos clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.name} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4" aria-label={`Avaliação: ${t.rating} estrelas`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6 italic">"{t.text}"</p>
                <footer>
                  <cite className="not-italic">
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.city}</p>
                  </cite>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white" aria-labelledby="faq-title">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-700 font-semibold text-sm uppercase tracking-wider">Dúvidas</span>
            <h2 id="faq-title" className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-4">Perguntas frequentes</h2>
          </div>
          <dl className="space-y-3">
            {FAQS.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                <dt>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
                    aria-expanded={openFaq === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="font-semibold text-slate-900">{faq.q}</span>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-4 ${openFaq === index ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </dt>
                {openFaq === index && (
                  <dd id={`faq-answer-${index}`} className="px-5 pb-5 bg-slate-50">
                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-gradient-to-br from-blue-900 to-blue-800 text-white" aria-label="Chamada para ação">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para tirar seu visto americano?
          </h2>
          <p className="text-xl text-blue-200 mb-10">
            Junte-se a centenas de brasileiros que já realizaram o sonho de visitar os EUA com nossa assessoria.
          </p>
          <Link
            href="/checkout"
            className="inline-flex items-center gap-3 bg-white text-blue-900 font-bold text-lg px-10 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Começar meu visto agora
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <span className="font-bold text-white">Cia do Visto</span>
            </div>
            <nav className="flex gap-6 text-sm" aria-label="Links do rodapé">
              <a href="#" className="hover:text-white transition-colors">Termos de uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999'}`}
                className="hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </nav>
            <p className="text-sm">
              <span>© {new Date().getFullYear()} Cia do Visto. Todos os direitos reservados.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
