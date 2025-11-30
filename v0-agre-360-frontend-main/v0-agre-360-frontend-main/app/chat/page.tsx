"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [responses, setResponses] = useState<string[]>([])

  const send = async () => {
    try {
      const api = (await import("@/lib/api")).chat
      const res: any = await api.send(message)
      setResponses((r) => [...r, res?.reply || JSON.stringify(res)])
      setMessage("")
    } catch (err) {
      alert("Chat failed")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <div className="space-y-4 mb-6">
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message" />
        <Button onClick={send}>Send</Button>
      </div>

      <div className="space-y-2">
        {responses.map((r, i) => (
          <div key={i} className="p-3 border rounded">{r}</div>
        ))}
      </div>
    </div>
  )
}
