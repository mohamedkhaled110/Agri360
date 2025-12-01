'use client'

import { useState, useRef, useEffect } from 'react'
import api from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

/**
 * Example: Chat/AI Component
 * Shows how to integrate with the AI chat endpoint
 */
export default function ChatExample() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message to display
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      // Send to backend API
      const response = await api.chat.send(input)
      console.log('Chat response:', response)

      // Add AI response to display
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response || JSON.stringify(response),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
      // Add error message to chat
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${err.message}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col h-screen">
      <h2 className="text-2xl font-bold mb-4">AI Chat Example</h2>

      {error && <div className="bg-red-100 p-3 rounded mb-4">{error}</div>}

      {/* Messages Display */}
      <div className="flex-1 border rounded p-4 mb-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-8">
            Start a conversation with the AI assistant
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-300 text-black rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI assistant..."
          className="flex-1 p-3 border rounded"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {/* Debug Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>API Endpoint: POST /api/chat</p>
        <p>Messages: {messages.length}</p>
      </div>
    </div>
  )
}
