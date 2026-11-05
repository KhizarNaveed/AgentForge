import { Fragment } from 'react'
import { cn } from '@/lib/utils'

function Item({ label, value, valueClassName }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-[#71717a]">{label}</span>
      <span className={cn('font-mono text-[#ededed]', valueClassName)}>{value}</span>
    </span>
  )
}

function Separator() {
  return <span className="text-[#3f3f46]" aria-hidden>|</span>
}

/**
 * Telemetry bar shown above the chat.
 * Props:
 *  - agent: currently selected agent id
 *  - telemetry: { model_used, provider, latency_ms, fallback_triggered } | null
 */
export default function Telemetry({ agent, telemetry }) {
  const items = telemetry
    ? [
        { label: 'Model', value: telemetry.model_used },
        { label: 'Provider', value: telemetry.provider },
        { label: 'Latency', value: `${telemetry.latency_ms}ms` },
        {
          label: 'Fallback',
          value: telemetry.fallback_triggered ? 'Yes' : 'No',
          valueClassName: telemetry.fallback_triggered ? 'text-amber-400' : 'text-emerald-400',
        },
      ]
    : null

  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-[#27272a] px-4 text-xs text-[#a1a1aa]">
      <div className="flex items-center gap-2">
        <span className="text-[#71717a]">Agent</span>
        <span className="rounded border border-[#27272a] bg-[#161618] px-1.5 py-0.5 font-medium capitalize text-[#ededed]">
          {agent}
        </span>
      </div>

      <div className="h-4 w-px bg-[#27272a]" aria-hidden />

      {items ? (
        <div className="flex min-w-0 items-center gap-3 overflow-x-auto">
          {items.map((item, i) => (
            <Fragment key={item.label}>
              {i > 0 && <Separator />}
              <Item {...item} />
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 text-[#52525b]">
          <Item label="Model" value="—" valueClassName="text-[#52525b]" />
          <Separator />
          <Item label="Provider" value="—" valueClassName="text-[#52525b]" />
          <Separator />
          <Item label="Latency" value="—" valueClassName="text-[#52525b]" />
          <Separator />
          <Item label="Fallback" value="—" valueClassName="text-[#52525b]" />
          <span className="ml-2 italic">Awaiting first response</span>
        </div>
      )}
    </header>
  )
}

