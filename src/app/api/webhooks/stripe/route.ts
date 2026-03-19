import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWelcomeEmails, sendStatusEmail } from '@/lib/email/automations'
import { PACKAGES } from '@/config/packages'
import type { PackageId } from '@/config/packages'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const metadata = paymentIntent.metadata
      const amountBrl = paymentIntent.amount / 100

      if (metadata.type === 'consular_fee') {
        // Taxa consular — atualizar processo existente
        const processId = metadata.processId
        if (!processId) return NextResponse.json({ received: true })

        await supabaseAdmin
          .from('processes')
          .update({
            status: 'consular_fee_paid',
            consular_payment_id: paymentIntent.id,
            consular_amount_brl: amountBrl,
            consular_paid_at: new Date().toISOString(),
          })
          .eq('id', processId)

        await sendStatusEmail(processId, 'consular_fee_paid')
      } else {
        // Checkout inicial — criar usuário + processo + applicant
        const { packageId, customerName, customerEmail, customerPhone, couponCode, baseAmountCents } = metadata

        if (!packageId || !customerEmail) {
          return NextResponse.json({ received: true })
        }

        const pkg = PACKAGES[packageId as PackageId]
        if (!pkg) return NextResponse.json({ received: true })

        // Idempotência: verificar se pagamento já foi processado
        const { data: existingProcess } = await supabaseAdmin
          .from('processes')
          .select('id')
          .eq('consulting_payment_id', paymentIntent.id)
          .maybeSingle()

        if (existingProcess) {
          return NextResponse.json({ received: true })
        }

        // Criar ou recuperar usuário Supabase
        let userId: string

        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
          user_metadata: {
            name: customerName,
            phone: customerPhone || '',
          },
        })

        if (createError) {
          // Usuário já existe — buscar por email
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
          const existing = users.find((u) => u.email?.toLowerCase() === customerEmail.toLowerCase())
          if (!existing) {
            console.error('Stripe webhook: não foi possível criar/encontrar usuário para:', customerEmail)
            return NextResponse.json({ received: true })
          }
          userId = existing.id
        } else {
          userId = newUserData.user.id
        }

        // Criar processo
        const { data: newProcess, error: processError } = await supabaseAdmin
          .from('processes')
          .insert({
            user_id: userId,
            package: packageId,
            max_applicants: pkg.maxApplicants,
            status: 'pending_form',
            consulting_payment_id: paymentIntent.id,
            consulting_amount_brl: amountBrl,
            consulting_paid_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (processError || !newProcess) {
          console.error('Stripe webhook: erro ao criar processo:', processError)
          return NextResponse.json({ error: 'Erro ao criar processo' }, { status: 500 })
        }

        // Criar solicitante principal
        const nameParts = (customerName || '').trim().split(' ')
        const givenName = nameParts[0] || ''
        const surname = nameParts.slice(1).join(' ') || givenName

        await supabaseAdmin.from('applicants').insert({
          process_id: newProcess.id,
          is_primary: true,
          label: 'Solicitante Principal',
          given_name: givenName,
          surname,
          email: customerEmail,
          phone_mobile: customerPhone || null,
          form_step: 1,
        })

        // Registrar uso de cupom se houver
        if (couponCode) {
          const { data: coupon } = await supabaseAdmin
            .from('coupons')
            .select('id')
            .eq('code', couponCode.toUpperCase())
            .maybeSingle()

          if (coupon) {
            const discountCents = baseAmountCents
              ? Number(baseAmountCents) - paymentIntent.amount
              : 0
            await supabaseAdmin.from('coupon_uses').insert({
              coupon_id: coupon.id,
              process_id: newProcess.id,
              discount_applied_brl: Math.max(0, discountCents) / 100,
            } as never)
          }
        }

        // Enviar magic link para o cliente acessar o dashboard
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: customerEmail,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          },
        })

        // Enviar emails de boas-vindas
        await sendWelcomeEmails(newProcess.id, amountBrl, pkg.name)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
