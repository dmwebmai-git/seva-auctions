'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'

type Phase = 'working' | 'success' | 'error'

export function SsoClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const started = useRef(false)

  const [phase, setPhase] = useState<Phase>('working')
  const [message, setMessage] = useState<string>('Signing you in through Seva Connect…')

  useEffect(() => {
    // Guard against React 18 double-invoke in dev / re-renders.
    if (started.current) return
    started.current = true

    const code = searchParams?.get('code')?.trim()
    const callbackUrl = searchParams?.get('callbackUrl') || '/'

    if (!code) {
      setPhase('error')
      setMessage('This sign-in link is missing its security code. Please return to the Seva Marketplace and click through again.')
      return
    }

    ;(async () => {
      try {
        const res = await signIn('seva-sso', {
          code,
          redirect: false,
        })

        if (res?.ok && !res.error) {
          setPhase('success')
          setMessage('Success! Taking you to the auctions…')
          // Give NextAuth a moment to persist the session cookie.
          setTimeout(() => {
            router.replace(callbackUrl)
          }, 600)
        } else {
          setPhase('error')
          setMessage(
            'We could not sign you in automatically. Your secure link may have expired — please return to the Seva Marketplace and click through again, or sign in manually below.'
          )
        }
      } catch {
        setPhase('error')
        setMessage(
          'Something went wrong while signing you in. Please try again from the Seva Marketplace, or sign in manually below.'
        )
      }
    })()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#94B957] via-[#BFA459] to-[#524C4C] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="seva-card p-8 text-center seva-fade-in">
          {phase === 'working' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#94B957]/10">
                <Loader2 className="h-8 w-8 animate-spin text-[#94B957]" />
              </div>
              <h1 className="seva-heading-lg text-[#524C4C] mb-2">Connecting to Seva</h1>
              <p className="text-gray-600 text-sm">{message}</p>
            </>
          )}

          {phase === 'success' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#94B957]/10">
                <ShieldCheck className="h-8 w-8 text-[#94B957]" />
              </div>
              <h1 className="seva-heading-lg text-[#524C4C] mb-2">You're in</h1>
              <p className="text-gray-600 text-sm">{message}</p>
            </>
          )}

          {phase === 'error' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#BFA459]/10">
                <AlertTriangle className="h-8 w-8 text-[#BFA459]" />
              </div>
              <h1 className="seva-heading-lg text-[#524C4C] mb-2">Sign-in link problem</h1>
              <p className="text-gray-600 text-sm mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-lg bg-[#94B957] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#7A9941]"
                >
                  Sign in manually
                </Link>
                <Link
                  href="/"
                  className="text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  ← Back to Auctions
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
