import { supabase } from './supabase'

export interface Notification {
  id: string
  userId: string
  type: 'meeting' | 'message' | 'comment' | 'review'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

// 알림 생성
export async function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  link?: string
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      userId,
      type,
      title,
      message,
      link,
      read: false,
    } as any)
    .select()
    .single()

  if (error) {
    console.error('Create notification error:', error)
    return null
  }

  // 웹 푸시 알림 전송 (선택사항)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    })
  }

  return data
}

// 알림 목록 가져오기
export async function getNotifications(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Get notifications error:', error)
    return []
  }

  return data as Notification[]
}

// 읽지 않은 알림 수
export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('userId', userId)
    .eq('read', false)

  if (error) {
    console.error('Get unread count error:', error)
    return 0
  }

  return count || 0
}

// 알림 읽음 처리
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await ((supabase
    .from('notifications') as any)
    .update({ read: true })
    .eq('id', notificationId))

  if (error) {
    console.error('Mark as read error:', error)
    return false
  }

  return true
}

// 모든 알림 읽음 처리
export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await ((supabase
    .from('notifications') as any)
    .update({ read: true })
    .eq('userId', userId)
    .eq('read', false))

  if (error) {
    console.error('Mark all as read error:', error)
    return false
  }

  return true
}

// 웹 푸시 알림 권한 요청
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// 이메일 알림 전송 (Supabase Edge Function)
export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string
) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    })

    if (error) {
      console.error('Send email error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Send email failed:', error)
    return false
  }
}

// 알림 템플릿
export const notificationTemplates = {
  meetingInvite: (meetingTitle: string) => ({
    title: '모임 초대',
    message: `"${meetingTitle}" 모임에 초대되었습니다`,
  }),
  meetingReminder: (meetingTitle: string, time: string) => ({
    title: '모임 알림',
    message: `"${meetingTitle}" 모임이 ${time}에 시작됩니다`,
  }),
  newMessage: (senderName: string) => ({
    title: '새 메시지',
    message: `${senderName}님으로부터 새 메시지가 도착했습니다`,
  }),
  newComment: (postTitle: string) => ({
    title: '새 댓글',
    message: `"${postTitle}" 게시글에 새 댓글이 달렸습니다`,
  }),
  newReview: (gymName: string) => ({
    title: '새 리뷰',
    message: `"${gymName}"에 새 리뷰가 작성되었습니다`,
  }),
}
