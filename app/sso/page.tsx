import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { SsoClient } from '@/components/sso/sso-client'

export const dynamic = 'force-dynamic'

function SsoFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#94B957] via-[#BFA459] to-[#524C4C] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="seva-card p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#94B957]/10">
            <Loader2 className="h-8 w-8 animate-spin text-[#94B957]" />
          </div>
          <h1 className="seva-heading-lg text-[#524C4C] mb-2">Connecting to Seva</h1>
          <p className="text-gray-600 text-sm">Preparing your secure sign-in…</p>
        </div>
      </div>
    </div>
  )
}

export default function SsoPage() {
  return (
    <Suspense fallback={<SsoFallback />}>
      <SsoClient />
    </Suspense>
  )
}
