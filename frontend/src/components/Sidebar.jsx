import { Code, Brain, Zap, PenTool, BarChart, Plus, MessageSquare, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const AGENTS = [
  { id: 'coder', label: 'Coder', description: 'Code generation & debugging', icon: Code },
  { id: 'reasoner', label: 'Reasoner', description: 'Multi-step logic', icon: Brain },
  { id: 'speedster', label: 'Speedster', description: 'Low-latency answers', icon: Zap },
  { id: 'creative', label: 'Creative', description: 'Writing & ideation', icon: PenTool },
  { id: 'analyst', label: 'Analyst', description: 'Data & structured analysis', icon: BarChart },
]

const AGENT_MODELS = {
  coder: [
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'openrouter/free',
    'gemini-1.5-pro',
  ],
  reasoner: [
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'gemini-1.5-pro',
    'openrouter/free',
  ],
  speedster: [
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'openrouter/free',
    'gemini-1.5-pro',
  ],
  creative: [
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-120b',
    'gemini-1.5-pro',
    'openrouter/free',
  ],
  analyst: [
    'openai/gpt-oss-120b',
    'gemini-1.5-pro',
    'llama-3.3-70b-versatile',
    'openrouter/free',
  ],
}

export default function Sidebar({
  selectedAgent,
  setSelectedAgent,
  selectedModel,
  setSelectedModel,
  onNewChat,
  history = [],
  activeSessionId,
  onLoadSession,
  onDeleteChat,
  connected = true,
}) {
  const currentModels = AGENT_MODELS[selectedAgent] || []
  const filteredHistory = history.filter((chat) => chat.agent === selectedAgent)

  const handleSelectAgent = (id) => {
    setSelectedAgent?.(id)
    setSelectedModel?.(null)
  }

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[#27272a] bg-[#161618]">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-[#27272a] px-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-[3px] bg-[#ededed]" aria-hidden />
          <span className="text-sm font-semibold tracking-tight text-[#ededed]">AgentForge</span>
        </div>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex h-8 w-full items-center gap-2 rounded-md border border-[#27272a] bg-[#0e0e10] px-2.5 text-xs font-medium text-[#ededed] transition-colors hover:border-[#3f3f46] hover:bg-[#1c1c1f] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#a1a1aa]"
        >
          <Plus className="h-3.5 w-3.5 text-[#a1a1aa]" strokeWidth={2} />
          New Chat
          <kbd className="ml-auto font-sans text-[10px] text-[#52525b]">Ctrl K</kbd>
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
        <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-[#71717a]">
          Agents
        </p>
        <ul className="space-y-0.5">
          {AGENTS.map(({ id, label, description, icon: Icon }) => {
            const isActive = selectedAgent === id
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => handleSelectAgent(id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'group flex w-full items-center gap-2.5 rounded-r-md border-l-2 py-1.5 pl-2.5 pr-2 text-left transition-colors focus:outline-none focus-visible:bg-[#1c1c1f]',
                    isActive
                      ? 'border-[#ededed] bg-[#27272a]'
                      : 'border-transparent hover:bg-[#1c1c1f]'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-[#ededed]' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block text-[13px] leading-5',
                        isActive ? 'font-medium text-[#ededed]' : 'text-[#a1a1aa] group-hover:text-[#ededed]'
                      )}
                    >
                      {label}
                    </span>
                    <span className="block truncate text-[11px] leading-4 text-[#71717a]">{description}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Manual Model Override */}
        <div className="mt-5">
          <label
            htmlFor="model-override-select"
            className="mb-1.5 block px-2 text-[10px] font-medium uppercase tracking-wider text-[#71717a]"
          >
            Model Override
          </label>
          <select
            id="model-override-select"
            value={selectedModel || ''}
            onChange={(e) => setSelectedModel?.(e.target.value || null)}
            className="h-8 w-full rounded-md border border-[#27272a] bg-[#0e0e10] px-2 font-mono text-[11px] text-[#ededed] transition-colors hover:border-[#3f3f46] focus:border-[#a1a1aa] focus:outline-none"
          >
            <option value="">Auto (Agent Fallback Chain)</option>
            {currentModels.map((m) => (
              <option key={m} value={m} className="bg-[#161618] font-mono text-[#ededed]">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Recent Chats */}
        <div className="mt-6">
          <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-[#71717a]">
            Recent Chats
          </p>
          {filteredHistory.length === 0 ? (
            <p className="px-2 py-1 text-xs text-[#52525b]">No past conversations</p>
          ) : (
            <ul className="space-y-0.5">
              {filteredHistory.map((chat) => {
                const isCurrentSession = activeSessionId === chat.session_id
                return (
                  <li key={chat.session_id}>
                    <div
                      className={cn(
                        'group relative flex w-full items-center justify-between rounded-md transition-colors',
                        isCurrentSession ? 'bg-[#27272a]' : 'hover:bg-[#1c1c1f]'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onLoadSession?.(chat.session_id, chat.agent || selectedAgent)}
                        title={chat.title}
                        className={cn(
                          'flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs focus:outline-none',
                          isCurrentSession ? 'text-[#ededed]' : 'text-[#a1a1aa] group-hover:text-[#ededed]'
                        )}
                      >
                        <MessageSquare
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            isCurrentSession ? 'text-[#ededed]' : 'text-[#52525b] group-hover:text-[#a1a1aa]'
                          )}
                          strokeWidth={1.75}
                        />
                        <span className="min-w-0 flex-1 truncate">{chat.title || 'Untitled Chat'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteChat?.(chat.session_id)
                        }}
                        title="Delete chat"
                        className="mr-1 rounded p-1 text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </nav>

      {/* Status */}
      <div className="flex h-10 items-center gap-2 border-t border-[#27272a] px-4">
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
          )}
          <span
            className={cn('relative inline-flex h-2 w-2 rounded-full', connected ? 'bg-emerald-500' : 'bg-red-500')}
          />
        </span>
        <span className="text-xs text-[#a1a1aa]">{connected ? 'API Connected' : 'API Disconnected'}</span>
        <span className="ml-auto font-mono text-[10px] text-[#52525b]">v0.1.0</span>
      </div>
    </aside>
  )
}
