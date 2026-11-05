import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

function UserMessage({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] whitespace-pre-wrap break-words rounded-lg border border-[#27272a] bg-[#161618] px-3.5 py-2.5 text-sm leading-relaxed text-[#ededed]">
        {content}
      </div>
    </div>
  )
}

function ErrorMessage({ content }) {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm leading-relaxed text-red-400">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        <span className="break-words">{content}</span>
      </div>
    </div>
  )
}

function AssistantMessage({ content, meta }) {
  return (
    <div className="flex justify-start">
      <div className="w-full min-w-0">
        <div className="text-sm leading-7 text-[#d4d4d8]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ node, inline, className, children, ...props }) {
                return (
                  <code className="bg-black text-gray-200 p-1 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                )
              },
              pre({ children }) {
                return <pre className="bg-black p-4 rounded-lg overflow-x-auto my-4 border border-[#27272a]">{children}</pre>
              },
              table({ children }) {
                return <table className="w-full text-left border-collapse my-4 border border-[#27272a]">{children}</table>
              },
              th({ children }) {
                return <th className="p-2 border-b border-[#27272a] bg-[#161618] font-semibold text-[#ededed]">{children}</th>
              },
              td({ children }) {
                return <td className="p-2 border-b border-[#27272a] text-[#a1a1aa]">{children}</td>
              },
              ul({ children }) {
                return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
              },
              ol({ children }) {
                return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {meta && (
          <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-[#52525b]">
            <span>{meta.model_used}</span>
            <span aria-hidden>•</span>
            <span>{meta.latency_ms}ms</span>
            {meta.fallback_triggered && (
              <>
                <span aria-hidden>•</span>
                <span className="text-amber-500/80">fallback</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-[#a1a1aa]" role="status" aria-live="polite">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a1a1aa] opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a1a1aa]" />
      </span>
      Thinking...
    </div>
  )
}

function EmptyState({ agent }) {
  return (
    <div className="flex h-full flex-col justify-end pb-6">
      <p className="text-sm font-medium text-[#ededed]">New conversation</p>
      <p className="mt-1 text-sm text-[#71717a]">
        Routing to <span className="font-mono capitalize text-[#a1a1aa]">{agent}</span>. If the primary model fails,
        AgentForge falls back through 3 more models automatically.
      </p>
    </div>
  )
}

export default function ChatWindow({ messages, isLoading, onSendMessage, agent }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to the newest message / loading indicator
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  // Auto-grow textarea (capped)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [input])

  const submit = () => {
    if (isLoading) return
    const prompt = input.trim()
    if (!prompt) return
    onSendMessage(prompt)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (!isLoading) {
        submit()
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex h-full max-w-3xl flex-col">
          {messages.length === 0 && !isLoading ? (
            <EmptyState agent={agent} />
          ) : (
            <div className="space-y-6 pb-2">
              {messages.map((m) =>
                m.role === 'user' ? (
                  <UserMessage key={m.id} content={m.content} />
                ) : m.role === 'error' ? (
                  <ErrorMessage key={m.id} content={m.content} />
                ) : (
                  <AssistantMessage key={m.id} content={m.content} meta={m.meta} />
                )
              )}
              {isLoading && <ThinkingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#27272a] p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg border border-[#27272a] bg-[#161618] p-2 transition-colors focus-within:border-[#3f3f46]"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Waiting for response...' : `Message ${agent}...`}
            className="max-h-[200px] min-h-[32px] flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm leading-5 text-[#ededed] placeholder:text-[#52525b] focus:outline-none disabled:opacity-50"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} aria-label="Send message">
            <Send className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-[11px] text-[#52525b]">
          <kbd className="font-sans text-[#71717a]">Enter</kbd> to send · <kbd className="font-sans text-[#71717a]">Shift + Enter</kbd> for newline
        </p>
      </div>
    </div>
  )
}
