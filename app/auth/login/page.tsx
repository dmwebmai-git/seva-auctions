
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#94B957] via-[#BFA459] to-[#524C4C] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="seva-card p-8 seva-fade-in">
          <div className="text-center mb-8">
            <h1 className="seva-heading-lg text-[#524C4C] mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-sm">
              Sign in with your Seva membership details
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Not a member yet?{' '}
              <Link 
                href="/auth/signup" 
                className="font-medium text-[#94B957] hover:text-[#7A9941] transition-colors"
              >
                Join Seva
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
