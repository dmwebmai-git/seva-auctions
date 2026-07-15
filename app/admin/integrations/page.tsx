import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { IntegrationsManager } from '@/components/admin/integrations-manager'

export const dynamic = 'force-dynamic'

export default async function AdminIntegrationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageSettings(session.user.role)) {
    redirect('/auth/login')
  }
  return <IntegrationsManager />
}
