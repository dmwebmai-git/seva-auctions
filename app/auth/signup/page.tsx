
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import Link from 'next/link'
import { ExternalLink, ShieldCheck, Sparkles, LogIn } from 'lucide-react'

const SEVA_SIGNUP_URL = 'https://www.thesevamarketplace.com/signup'

export default async function SignupPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#94B957] via-[#BFA459] to-[#524C4C] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="seva-card p-8 seva-fade-in">
          <div className="text-center mb-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#94B957]/10">
              <ShieldCheck className="h-8 w-8 text-[#94B957]" />
            </div>
            <h1 className="seva-heading-lg text-[#524C4C] mb-2">
              Join with a Seva membership
            </h1>
            <p className="text-gray-600 text-sm">
              Seva Auctions is exclusively for Seva members. Create your free Seva
              Connect membership, then come back and sign in with those details to
              start bidding for a cause.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#94B957]/10">
                <Sparkles className="h-3.5 w-3.5 text-[#94B957]" />
              </div>
              <p className="text-sm text-gray-600">
                Your Seva membership unlocks bidding, buy-now purchases, and points
                on every auction you support.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#94B957]/10">
                <LogIn className="h-3.5 w-3.5 text-[#94B957]" />
              </div>
              <p className="text-sm text-gray-600">
                Already have a Seva membership? Just{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-[#94B957] hover:text-[#7A9941] transition-colors"
                >
                  sign in
                </Link>{' '}
                — no separate account needed.
              </p>
            </div>
          </div>

          <a
            href={SEVA_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#94B957] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#7A9941]"
          >
            Create your Seva membership
            <ExternalLink className="h-4 w-4" />
          </a>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already a member?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-[#94B957] hover:text-[#7A9941] transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Auctions
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
