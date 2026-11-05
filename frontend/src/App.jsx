import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { X } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Telemetry from '@/components/Telemetry'
import ChatWindow from '@/components/ChatWindow'

const API_BASE = 'http://127.0.0.1:8000'

const INITIAL_MESSAGES = {
  coder: [],
  reasoner: [],
  speedster: [],
  creative: [],
  analyst: [],
}

const createInitialSessions = () => ({
  coder: crypto.randomUUID(),
  reasoner: crypto.randomUUID(),
  speedster: crypto.randomUUID(),
  creative: crypto.randomUUID(),
  analyst: crypto.randomUUID(),
})

const INITIAL_TELEMETRY = {
  coder: null,
  reasoner: null,
  speedster: null,
  creative: null,
  analyst: null,
}

export default function App() {
  const [allMessages, setAllMessages] = useState(INITIAL_MESSAGES)
  const [sessions, setSessions] = useState(createInitialSessions)
  const [selectedAgent, setSelectedAgent] = useState('coder')
  const [selectedModel, setSelectedModel] = useState(null)
  const [allTelemetry, setAllTelemetry] = useState(INITIAL_TELEMETRY)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)

  const currentMessages = allMessages[selectedAgent] || []
  const currentSessionId = sessions[selectedAgent]
  const currentTelemetry = allTelemetry[selectedAgent] || null

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/history`, { timeout: 6000 })
      if (Array.isArray(data)) {
        setHistory(data)
      }
    } catch {
      /* ignore if backend is offline on initial load */
    }
  }, [])

  // Fetch past chat sessions on mount
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Live backend status (GET /health), polled every 15s
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        await axios.get(`${API_BASE}/health`, { timeout: 4000 })
        if (!cancelled) setConnected(true)
      } catch {
        if (!cancelled) setConnected(false)
      }
    }
    check()
    const id = setInterval(check, 15000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Auto-dismiss error toast
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 6000)
    return () => clearTimeout(t)
  }, [error])

  const loadSession = useCallback(async (sessionId, agent) => {
    const targetAgent = agent || 'coder'
    setSelectedAgent(targetAgent)
    setSelectedModel(null)
    setError(null)

    try {
      const { data } = await axios.get(`${API_BASE}/api/history/${sessionId}`)
      if (Array.isArray(data)) {
        const formatted = data.map((row) => ({
          id: row.id || crypto.randomUUID(),
          role: row.role,
          content: row.content,
          agent: row.agent || targetAgent,
          meta:
            row.role === 'assistant' && row.model_used
              ? {
                  model_used: row.model_used,
                  provider: row.provider,
                  latency_ms: row.latency_ms,
                  fallback_triggered: Boolean(row.fallback_triggered),
                }
              : undefined,
        }))

        const lastAssistantWithMeta = [...formatted].reverse().find((m) => m.role === 'assistant' && m.meta)

        setAllMessages((prev) => ({
          ...prev,
          [targetAgent]: formatted,
        }))
        setSessions((prev) => ({
          ...prev,
          [targetAgent]: sessionId,
        }))
        setAllTelemetry((prev) => ({
          ...prev,
          [targetAgent]: lastAssistantWithMeta ? lastAssistantWithMeta.meta : null,
        }))
      }
    } catch {
      setError('Failed to load session history.')
    }
  }, [])

  const handleSendMessage = useCallback(
    async (prompt) => {
      const targetAgent = selectedAgent
      const targetSessionId = sessions[targetAgent]
      const agentHistory = allMessages[targetAgent] || []

      setAllMessages((prev) => ({
        ...prev,
        [targetAgent]: [...(prev[targetAgent] || []), { id: crypto.randomUUID(), role: 'user', content: prompt }],
      }))
      setIsLoading(true)
      setError(null)

      try {
        const historyPayload = agentHistory
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            role: m.role,
            content: m.content,
          }))

        const { data } = await axios.post(`${API_BASE}/api/generate`, {
          prompt,
          agent: targetAgent,
          session_id: targetSessionId,
          model_override: selectedModel,
          history: historyPayload,
        })

        const meta = {
          model_used: data.model_used,
          provider: data.provider,
          latency_ms: data.latency_ms,
          fallback_triggered: data.fallback_triggered,
        }

        setAllMessages((prev) => ({
          ...prev,
          [targetAgent]: [
            ...(prev[targetAgent] || []),
            { id: crypto.randomUUID(), role: 'assistant', content: data.answer, agent: targetAgent, meta },
          ],
        }))
        setAllTelemetry((prev) => ({
          ...prev,
          [targetAgent]: meta,
        }))
        if (data.session_id && data.session_id !== targetSessionId) {
          setSessions((prev) => ({
            ...prev,
            [targetAgent]: data.session_id,
          }))
        }
        setConnected(true)
        fetchHistory()
      } catch (err) {
        const detail = err.response?.data?.detail
        const msg = err.response
          ? `Request failed (${err.response.status})${detail ? `: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`
          : 'Cannot reach the AgentForge API at 127.0.0.1:8000. Is the backend running?'
        if (!err.response) setConnected(false)
        setAllMessages((prev) => ({
          ...prev,
          [targetAgent]: [...(prev[targetAgent] || []), { id: crypto.randomUUID(), role: 'error', content: msg }],
        }))
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [selectedAgent, selectedModel, sessions, allMessages, fetchHistory]
  )

  const handleAgentChange = (agentId) => {
    setSelectedAgent(agentId)
    setSelectedModel(null)
  }

  const handleNewChat = () => {
    setAllMessages((prev) => ({
      ...prev,
      [selectedAgent]: [],
    }))
    setAllTelemetry((prev) => ({
      ...prev,
      [selectedAgent]: null,
    }))
    setSessions((prev) => ({
      ...prev,
      [selectedAgent]: crypto.randomUUID(),
    }))
    setError(null)
  }

  const handleDeleteChat = async (sessionId) => {
    try {
      await axios.delete(`${API_BASE}/api/history/${sessionId}`)
      fetchHistory()

      // If the user deletes the chat they are currently looking at, clear the screen
      if (sessions[selectedAgent] === sessionId) {
        setAllMessages((prev) => ({ ...prev, [selectedAgent]: [] }))
        setAllTelemetry((prev) => ({ ...prev, [selectedAgent]: null }))
        setSessions((prev) => ({ ...prev, [selectedAgent]: crypto.randomUUID() }))
      }
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0e0e10] text-[#ededed] antialiased">
      <Sidebar
        selectedAgent={selectedAgent}
        setSelectedAgent={handleAgentChange}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onNewChat={handleNewChat}
        history={history}
        activeSessionId={currentSessionId}
        onLoadSession={loadSession}
        onDeleteChat={handleDeleteChat}
        connected={connected}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <Telemetry agent={selectedAgent} telemetry={currentTelemetry} />
        <ChatWindow
          messages={currentMessages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          agent={selectedAgent}
          sessionId={currentSessionId}
        />

        {/* Error toast */}
        {error && (
          <div
            role="alert"
            className="absolute bottom-24 right-4 flex max-w-sm items-start gap-3 rounded-md border border-red-500/30 bg-[#161618] px-3 py-2.5 text-xs text-[#ededed] shadow-lg shadow-black/40"
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            <span className="flex-1 leading-relaxed">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[#71717a] hover:text-[#ededed]"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
