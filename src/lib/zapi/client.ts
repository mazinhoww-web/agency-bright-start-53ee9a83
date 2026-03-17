const ZAPI_BASE = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}`

interface SendTextOptions {
  phone: string // formato: 5511999999999
  message: string
}

export async function sendWhatsAppText({ phone, message }: SendTextOptions) {
  const res = await fetch(`${ZAPI_BASE}/send-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': process.env.ZAPI_CLIENT_TOKEN!,
    },
    body: JSON.stringify({ phone, message }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Z-API error: ${error}`)
  }

  return res.json()
}

// Templates de mensagem por evento
export const WHATSAPP_TEMPLATES = {
  welcome: (name: string, packageName: string, link: string) =>
    `Olá ${name}! Seja bem-vindo(a) à Cia do Visto 🗽\n\nSeu pacote *${packageName}* foi confirmado com sucesso!\n\nAgora preencha o formulário com seus dados para darmos início ao processo:\n${link}\n\nQualquer dúvida, estamos aqui!`,

  formReceived: (name: string) =>
    `Olá ${name}! Recebemos seu formulário DS-160 com sucesso ✅\n\nNossa consultora irá revisar as informações e entrar em contato em breve.\n\nAcompanhe o status do seu processo pelo portal.`,

  consularFeePaid: (name: string, link: string) =>
    `Taxa consular confirmada, ${name}! ✅\n\nAgora você pode informar suas datas de preferência para o agendamento:\n${link}`,

  appointmentReceived: (name: string) =>
    `Intenção de agendamento recebida, ${name}! 📅\n\nNossa consultora irá verificar a disponibilidade real e confirmar as datas com você em breve.\n\n*Lembrete:* As datas informadas são apenas uma intenção — não garantimos disponibilidade.`,

  documentAvailable: (name: string, docName: string, link: string) =>
    `Novo documento disponível no seu portal, ${name}! 📄\n\n*${docName}*\n\nAcesse e faça o download:\n${link}`,

  processCompleted: (name: string, link: string) =>
    `Parabéns, ${name}! 🎉\n\nToda a sua documentação está pronta para a entrevista consular.\n\nAcesse o portal para baixar tudo:\n${link}\n\nBoa sorte na entrevista! 🍀`,
}
