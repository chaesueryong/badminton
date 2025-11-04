"use client";

import { useEffect, useState } from 'react'
import { subscribeToMessages, unsubscribeFromMessages, Message } from '@/lib/realtime'

export function useRealtimeMessages(userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!userId) return

    const channel = subscribeToMessages(userId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage])
    })

    return () => {
      unsubscribeFromMessages(channel)
    }
  }, [userId])

  return messages
}
