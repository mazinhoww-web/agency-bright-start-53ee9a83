import { ImageResponse } from 'next/og'

// Rota: /opengraph-image
// Gera a imagem OG padrão do site (1200×630px)
export const runtime = 'edge'
export const alt = 'Cia do Visto — Assessoria para Vistos Americanos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #1e40af 100%)',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'white',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1e40af',
            }}
          >
            CV
          </div>
          <span style={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}>
            Cia do Visto
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: 'white',
            fontSize: '64px',
            fontWeight: 'bold',
            lineHeight: 1.1,
            margin: '0 0 24px 0',
            maxWidth: '900px',
          }}
        >
          Seu visto americano com quem entende
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: '#bfdbfe',
            fontSize: '28px',
            margin: '0 0 48px 0',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Assessoria digital completa para vistos B1/B2 de turismo
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '48px' }}>
          {[
            { value: '500+', label: 'Vistos aprovados' },
            { value: '98%', label: 'Taxa de aprovação' },
            { value: 'A partir de R$ 299', label: 'Assessoria completa' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>{stat.value}</span>
              <span style={{ color: '#93c5fd', fontSize: '18px' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            right: '80px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '9999px',
            padding: '10px 24px',
            color: 'white',
            fontSize: '20px',
          }}
        >
          ciadovisto.com.br
        </div>
      </div>
    ),
    { ...size }
  )
}
