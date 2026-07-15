'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// Brand palette used across the charts
const COLORS = ['#94B957', '#FF9A17', '#BFA459', '#7A9941', '#0DA354', '#524C4C', '#FFC266', '#B7D07A']

function currency(value: number) {
  return `$${Math.round(value).toLocaleString()}`
}

export function CategoryBarChart({ data }: { data: { name: string; count: number }[] }) {
  if (!data.length) {
    return <p className="text-sm text-gray-500">No auction data yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis
          dataKey="name"
          angle={-25}
          textAnchor="end"
          interval={0}
          height={60}
          tick={{ fontSize: 11, fill: '#524C4C' }}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#524C4C' }} />
        <Tooltip cursor={{ fill: 'rgba(148,185,87,0.08)' }} />
        <Bar dataKey="count" name="Auctions" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0)
  if (!filtered.length) {
    return <p className="text-sm text-gray-500">No bids recorded yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(entry) => entry.name}
          labelLine={false}
          fontSize={11}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function PricePointsChart({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  if (!data.length) {
    return <p className="text-sm text-gray-500">No pricing data yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 40, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
        <XAxis type="number" tickFormatter={currency} tick={{ fontSize: 11, fill: '#524C4C' }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#524C4C' }} />
        <Tooltip formatter={(v: number) => currency(v)} cursor={{ fill: 'rgba(148,185,87,0.08)' }} />
        <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function FundsRaisedChart({
  data,
}: {
  data: { name: string; realized: number; inProgress: number }[]
}) {
  const filtered = data.filter((d) => d.realized > 0 || d.inProgress > 0)
  if (!filtered.length) {
    return <p className="text-sm text-gray-500">No funds raised data yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={filtered} margin={{ top: 8, right: 8, left: 8, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis
          dataKey="name"
          angle={-25}
          textAnchor="end"
          interval={0}
          height={60}
          tick={{ fontSize: 11, fill: '#524C4C' }}
        />
        <YAxis tickFormatter={currency} tick={{ fontSize: 11, fill: '#524C4C' }} width={70} />
        <Tooltip formatter={(v: number) => currency(v)} cursor={{ fill: 'rgba(148,185,87,0.08)' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="realized" stackId="funds" name="Realized (won)" fill="#0DA354" radius={[0, 0, 0, 0]} />
        <Bar dataKey="inProgress" stackId="funds" name="In progress (active)" fill="#FF9A17" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
