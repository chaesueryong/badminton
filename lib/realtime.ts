import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// 메시지 타입
export interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  read: boolean
  createdAt: string
}

// 실시간 메시지 구독
export function subscribeToMessages(
  userId: string,
  onMessage: (message: Message) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiverId=eq.${userId}`,
      },
      (payload) => {
        onMessage(payload.new as Message)
      }
    )
    .subscribe()

  return channel
}

// 구독 해제
export function unsubscribeFromMessages(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}

// 메시지 전송
export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      senderId,
      receiverId,
      content,
      read: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Send message error:', error)
    return null
  }

  return data
}

// 메시지 목록 가져오기
export async function getMessages(userId1: string, userId2: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(senderId.eq.${userId1},receiverId.eq.${userId2}),and(senderId.eq.${userId2},receiverId.eq.${userId1})`
    )
    .order('createdAt', { ascending: true })

  if (error) {
    console.error('Get messages error:', error)
    return []
  }

  return data as Message[]
}

// 메시지 읽음 처리
export async function markMessagesAsRead(userId: string, otherUserId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('receiverId', userId)
    .eq('senderId', otherUserId)
    .eq('read', false)

  if (error) {
    console.error('Mark as read error:', error)
    return false
  }

  return true
}

// 읽지 않은 메시지 수
export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiverId', userId)
    .eq('read', false)

  if (error) {
    console.error('Get unread count error:', error)
    return 0
  }

  return count || 0
}
