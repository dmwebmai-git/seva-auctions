
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getActiveConnection, exchangeCode, verifyMember } from '@/lib/seva-connect'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const email = credentials.email.toLowerCase().trim()
        const password = credentials.password

        // 1) Local password login — reserved for internal admin/staff accounts.
        const localUser = await prisma.user.findUnique({ where: { email } })
        if (localUser?.password) {
          const isPasswordValid = await bcrypt.compare(password, localUser.password)
          if (isPasswordValid) {
            return {
              id: localUser.id,
              email: localUser.email,
              name: `${localUser.firstName || ''} ${localUser.lastName || ''}`.trim() || localUser.email,
              firstName: localUser.firstName,
              lastName: localUser.lastName,
              role: localUser.role,
              sevaConsumerId: localUser.sevaConsumerId,
            } as any
          }
        }

        // 2) Seva Connect membership login — all public members authenticate here.
        // We verify the supplied credentials against Seva Connect; on success we
        // find/create the matching local auction account and link it by consumer id.
        const conn = await getActiveConnection()
        if (conn) {
          const res = await verifyMember(conn, email, password)
          if (res.ok && res.data?.verified && res.data.consumer?.id) {
            const consumer = res.data.consumer
            const cEmail = consumer.email?.toLowerCase() || email

            let user = await prisma.user.findFirst({ where: { sevaConsumerId: consumer.id } })
            if (!user) {
              user = await prisma.user.findUnique({ where: { email: cEmail } })
            }

            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  sevaConsumerId: consumer.id,
                  firstName: user.firstName ?? consumer.firstName ?? null,
                  lastName: user.lastName ?? consumer.lastName ?? null,
                },
              })
            } else {
              user = await prisma.user.create({
                data: {
                  email: cEmail,
                  firstName: consumer.firstName ?? null,
                  lastName: consumer.lastName ?? null,
                  sevaConsumerId: consumer.id,
                  role: 'user',
                  emailVerified: new Date(),
                },
              })
            }

            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              sevaConsumerId: user.sevaConsumerId,
              sevaToken: res.data.token,
              sevaTokenExpiresAt: res.data.expiresAt,
            } as any
          }
        }

        throw new Error('Invalid credentials')
      }
    }),
    /**
     * Seamless Seva Connect SSO.
     *
     * Used by the /sso landing page: when a member clicks "Go to Auctions" in
     * the Seva Marketplace portal, Seva redirects here with a one-time code.
     * We exchange that code (server-to-server, with the secret API key) for the
     * member's identity, then find/create the matching local auction account
     * and start their session — no password is ever entered.
     *
     * The `sevaToken` returned by `authorize` is threaded to the JWT so the
     * member's short-lived Seva session token is available to downstream flows
     * (points, donations) right after login.
     */
    CredentialsProvider({
      id: 'seva-sso',
      name: 'Seva Connect',
      credentials: {
        code: { label: 'Hand-off code', type: 'text' },
      },
      async authorize(credentials) {
        const code = credentials?.code?.trim()
        if (!code) {
          throw new Error('Missing Seva hand-off code')
        }

        const conn = await getActiveConnection()
        if (!conn) {
          throw new Error('No active Seva Connect connection is configured')
        }

        const res = await exchangeCode(conn, code)
        if (!res.ok || !res.data?.verified || !res.data.consumer) {
          throw new Error(res.error || 'Seva hand-off code could not be verified')
        }

        const consumer = res.data.consumer
        const email = consumer.email?.toLowerCase()
        if (!consumer.id || !email) {
          throw new Error('Seva did not return a valid member identity')
        }

        // Link by Seva consumer id first, then fall back to email so an existing
        // auction account with the same email is adopted (and stamped with the id).
        let user = await prisma.user.findFirst({ where: { sevaConsumerId: consumer.id } })
        if (!user) {
          user = await prisma.user.findUnique({ where: { email } })
        }

        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              sevaConsumerId: consumer.id,
              firstName: user.firstName ?? consumer.firstName ?? null,
              lastName: user.lastName ?? consumer.lastName ?? null,
            },
          })
        } else {
          user = await prisma.user.create({
            data: {
              email,
              firstName: consumer.firstName ?? null,
              lastName: consumer.lastName ?? null,
              sevaConsumerId: consumer.id,
              role: 'user',
              emailVerified: new Date(),
            },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          sevaConsumerId: user.sevaConsumerId,
          sevaToken: res.data.token,
          sevaTokenExpiresAt: res.data.expiresAt,
        } as any
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        token.role = u.role
        token.firstName = u.firstName
        token.lastName = u.lastName
        token.sevaConsumerId = u.sevaConsumerId ?? null
        if (u.sevaToken) token.sevaToken = u.sevaToken
        if (u.sevaTokenExpiresAt) token.sevaTokenExpiresAt = u.sevaTokenExpiresAt
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
        session.user.role = token.role as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        ;(session.user as any).sevaConsumerId = (token.sevaConsumerId as string) ?? null
        ;(session.user as any).sevaToken = (token.sevaToken as string) ?? null
        ;(session.user as any).sevaTokenExpiresAt = (token.sevaTokenExpiresAt as string) ?? null
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
