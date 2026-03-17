'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function VerifyPage() {
  const router = useRouter()

  useEffect(() => {
    // TODO: verificar hash do magic link com Supabase
    // Supabase lida automaticamente com o callback
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Verificando seu acesso...</h1>
        <p className="text-slate-600">Aguarde um momento</p>
        <p className="text-sm text-slate-400 mt-4">
          <Link href="/login" className="text-blue-700 hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </div>
  )
}
