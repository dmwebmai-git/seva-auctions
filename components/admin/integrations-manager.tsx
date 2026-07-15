'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plug, Plus, ArrowLeft, Loader2, Trash2, Pencil, CheckCircle2, XCircle,
  AlertTriangle, KeyRound, Link2, ShieldCheck, FlaskConical, User,
} from 'lucide-react'
import { toast } from 'sonner'

const SCOPES = [
  { id: 'identity:verify', label: 'Verify member login', hint: 'identity:verify' },
  { id: 'consumer:read', label: 'Read profile, points, membership & organization', hint: 'consumer:read' },
  { id: 'consumer:write', label: 'Award / deduct points and log activity', hint: 'consumer:write' },
  { id: 'donation:write', label: 'Record donations to organizations', hint: 'donation:write' },
]

interface Connection {
  id: string
  name: string
  provider: string
  baseUrl: string
  apiKeyMasked: string
  scopes: string[]
  isActive: boolean
  lastTestedAt: string | null
  lastTestStatus: string | null
  lastTestMessage: string | null
}

const emptyForm = {
  id: '',
  name: '',
  baseUrl: 'https://thesevamarketplace.com',
  apiKey: '',
  scopes: ['identity:verify', 'consumer:read', 'consumer:write', 'donation:write'] as string[],
  isActive: true,
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'success') {
    return <Badge className="bg-[#0DA354]/10 text-[#0DA354] hover:bg-[#0DA354]/10 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>
  }
  if (status === 'warning') {
    return <Badge className="bg-[#FFC266]/20 text-[#B26B25] hover:bg-[#FFC266]/20 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>
  }
  if (status === 'error') {
    return <Badge className="bg-[#FF9A17]/10 text-[#C8443B] hover:bg-[#FF9A17]/10 border-0"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
  }
  return <Badge variant="secondary">Not tested</Badge>
}

export function IntegrationsManager() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/integrations')
      const data = await res.json()
      setConnections(data.connections || [])
    } catch {
      toast.error('Failed to load connections')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm(emptyForm)
    setEditing(false)
    setDialogOpen(true)
  }

  const openEdit = (c: Connection) => {
    setForm({ id: c.id, name: c.name, baseUrl: c.baseUrl, apiKey: '', scopes: c.scopes, isActive: c.isActive })
    setEditing(true)
    setDialogOpen(true)
  }

  const toggleScope = (id: string) => {
    setForm((f) => ({
      ...f,
      scopes: f.scopes.includes(id) ? f.scopes.filter((s) => s !== id) : [...f.scopes, id],
    }))
  }

  const save = async () => {
    if (!form.name.trim() || !form.baseUrl.trim()) {
      toast.error('Name and Base URL are required')
      return
    }
    if (!editing && !form.apiKey.trim()) {
      toast.error('API Key is required')
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/admin/integrations/${form.id}` : '/api/admin/integrations'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          baseUrl: form.baseUrl,
          apiKey: form.apiKey,
          scopes: form.scopes,
          isActive: form.isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success(editing ? 'Connection updated' : 'Connection created')
      setDialogOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save connection')
    } finally {
      setSaving(false)
    }
  }

  const runTest = async (id: string) => {
    setTestingId(id)
    try {
      const res = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.status === 'success') toast.success(data.message)
      else if (data.status === 'warning') toast.warning(data.message)
      else toast.error(data.message || data.error || 'Test failed')
      load()
    } catch {
      toast.error('Test failed')
    } finally {
      setTestingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/integrations/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Connection deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#94B957] mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="seva-heading-xl text-[#524C4C] flex items-center gap-3">
              <Plug className="w-7 h-7 text-[#94B957]" /> API Connections
            </h1>
            <p className="text-gray-600 mt-2">
              Manage secure connections to external services. Connect this auction site to
              Seva Connect to verify members, read points &amp; membership, and record donations.
            </p>
          </div>
          <Button onClick={openCreate} className="seva-button-primary shrink-0">
            <Plus className="w-4 h-4 mr-2" /> Add Connection
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading connections…
          </div>
        ) : connections.length === 0 ? (
          <Card className="seva-card">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#94B957]/10 flex items-center justify-center mx-auto mb-4">
                <Plug className="w-8 h-8 text-[#94B957]" />
              </div>
              <h3 className="text-lg font-semibold text-[#524C4C] mb-1">No connections yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add your Seva Connect API key to link members, points and donations between the two platforms.
              </p>
              <Button onClick={openCreate} className="seva-button-primary">
                <Plus className="w-4 h-4 mr-2" /> Add your first connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {connections.map((c) => (
              <Card key={c.id} className="seva-card">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-[#524C4C]">{c.name}</h3>
                        {c.isActive ? (
                          <Badge className="bg-[#94B957]/10 text-[#94B957] hover:bg-[#94B957]/10 border-0">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        <StatusBadge status={c.lastTestStatus} />
                      </div>
                      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                        <p className="flex items-center gap-2"><Link2 className="w-4 h-4 text-gray-400" /> {c.baseUrl}</p>
                        <p className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-gray-400" /> <span className="font-mono">{c.apiKeyMasked}</span></p>
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div className="flex flex-wrap gap-1.5">
                            {c.scopes.length ? c.scopes.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-mono">{s}</span>
                            )) : <span className="text-gray-400">No scopes selected</span>}
                          </div>
                        </div>
                        {c.lastTestMessage && (
                          <p className="text-xs text-gray-500 pt-1">Last test: {c.lastTestMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => runTest(c.id)} disabled={testingId === c.id}>
                        {testingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                        <span className="ml-1.5">Test</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteId(c.id)}
                        className="text-[#C8443B] hover:text-[#C8443B] hover:bg-[#FF9A17]/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Live member lookup tester */}
        {connections.length > 0 && <MemberLookup connections={connections} />}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Connection' : 'Add Connection'}</DialogTitle>
            <DialogDescription>
              Enter the credentials from your Seva Connect Admin Portal → API Keys screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="c-name">Label</Label>
              <Input id="c-name" className="seva-input mt-1" placeholder="e.g. Seva Connect (production)"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c-url">Base URL</Label>
              <Input id="c-url" className="seva-input mt-1" placeholder="https://thesevamarketplace.com"
                value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c-key">API Key {editing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}</Label>
              <Input id="c-key" className="seva-input mt-1 font-mono" placeholder="svak_live_…" type="password"
                value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
            </div>
            <div>
              <Label>Permissions (scopes)</Label>
              <div className="mt-2 space-y-2.5">
                {SCOPES.map((s) => (
                  <label key={s.id} className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={form.scopes.includes(s.id)} onCheckedChange={() => toggleScope(s.id)} className="mt-0.5" />
                    <span className="text-sm text-gray-700 leading-tight">
                      {s.label}
                      <span className="block text-xs text-gray-400 font-mono">{s.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <Label className="cursor-pointer">Active</Label>
                <p className="text-xs text-gray-500">Active connection is used by the auction site.</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="seva-button-primary">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Save changes' : 'Create connection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the stored API key from the auction site. External requests using this
              connection will stop working. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[#C8443B] hover:bg-[#b03a32]">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MemberLookup({ connections }: { connections: Connection[] }) {
  const active = connections.find((c) => c.isActive) || connections[0]
  const [connId, setConnId] = useState(active?.id || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const run = async () => {
    if (!connId || !email || !password) {
      toast.error('Select a connection and enter member email & password')
      return
    }
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/integrations/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: connId, email, password }),
      })
      const data = await res.json()
      setResult(data)
      if (data.verified) toast.success('Member verified via Seva Connect')
      else toast.error(data.error || 'Verification failed')
    } catch {
      toast.error('Lookup failed')
    } finally {
      setRunning(false)
    }
  }

  const points = result?.profile?.points

  return (
    <Card className="seva-card mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#524C4C]">
          <FlaskConical className="w-5 h-5 text-[#BFA459]" /> Live Member Lookup
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Verify a real Seva member's login and pull their profile, points, membership tier and
          chosen organization — end-to-end proof the connection works.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="l-conn">Connection</Label>
            <select id="l-conn" value={connId} onChange={(e) => setConnId(e.target.value)}
              className="seva-input mt-1 w-full bg-white">
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.isActive ? ' (active)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="l-email">Member email</Label>
            <Input id="l-email" className="seva-input mt-1" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com" />
          </div>
          <div>
            <Label htmlFor="l-pass">Member password</Label>
            <Input id="l-pass" type="password" className="seva-input mt-1" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Seva password" />
          </div>
        </div>
        <Button onClick={run} disabled={running} className="seva-button-primary">
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
          Verify &amp; fetch member
        </Button>

        {result && (
          <div className="mt-2 rounded-lg border border-gray-200 p-4 bg-gray-50">
            {result.verified ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2 text-[#0DA354] font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                  {result.expiresAt && <span className="text-gray-400 font-normal">· token expires {new Date(result.expiresAt).toLocaleString('en-US')}</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-[#524C4C] mb-1">Member</p>
                    <p>{result.consumer?.firstName} {result.consumer?.lastName}</p>
                    <p className="text-gray-500">{result.consumer?.email}</p>
                    {result.profile?.consumer?.city && (
                      <p className="text-gray-500">{result.profile.consumer.city}, {result.profile.consumer.state}</p>
                    )}
                  </div>
                  {points && (
                    <div>
                      <p className="font-semibold text-[#524C4C] mb-1">Points</p>
                      <p>Balance: <span className="font-semibold">{points.balance}</span></p>
                      <p className="text-gray-500">Game {points.gamePoints} · Reward {points.rewardPoints} · Redemption {points.redemptionPoints}</p>
                    </div>
                  )}
                  {result.membership && (
                    <div>
                      <p className="font-semibold text-[#524C4C] mb-1">Membership</p>
                      <p className="capitalize">Tier: <span className="font-semibold">{result.membership.membershipLevel}</span></p>
                      <p className="text-gray-500">Status: {result.membership.accountStatus} · Referrals: {result.membership.totalReferrals}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-[#524C4C] mb-1">Organization</p>
                    {result.organization?.organization ? (
                      <>
                        <p>{result.organization.organization.organizationName}</p>
                        <p className="text-gray-500">{result.organization.organization.organizationType} · {result.organization.organization.city}, {result.organization.organization.state}</p>
                      </>
                    ) : (
                      <p className="text-gray-400">No organization chosen</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#C8443B]">
                <XCircle className="w-4 h-4" /> {result.error || 'Verification failed'}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
