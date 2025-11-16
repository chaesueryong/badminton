import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GameSettings } from "@/config/game-settings";

// GET /api/messages - 메시지 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const otherUserId = searchParams.get("otherUserId");

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    if (otherUserId) {
      // 특정 사용자와의 대화 조회
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id (
            id,
            name,
            nickname,
            profile_image
          ),
          receiver:users!receiver_id (
            id,
            name,
            nickname,
            profile_image
          )
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("메시지 조회 실패:", error);
        return NextResponse.json(
          { error: "메시지 조회에 실패했습니다" },
          { status: 500 }
        );
      }

      // 읽지 않은 메시지 읽음 처리
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', userId)
        .eq('read', false);

      // camelCase로 변환
      const formattedMessages = messages?.map((msg: any) => ({
        ...msg,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        createdAt: msg.created_at,
        sender: msg.sender ? {
          ...msg.sender,
          profileImage: msg.sender.profile_image,
        } : null,
        receiver: msg.receiver ? {
          ...msg.receiver,
          profileImage: msg.receiver.profile_image,
        } : null,
      })) || [];

      return NextResponse.json(formattedMessages);
    } else {
      // 대화 목록 조회 (마지막 메시지 기준)
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id (
            id,
            name,
            nickname,
            profile_image
          ),
          receiver:users!receiver_id (
            id,
            name,
            nickname,
            profile_image
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("메시지 조회 실패:", error);
        return NextResponse.json(
          { error: "메시지 조회에 실패했습니다" },
          { status: 500 }
        );
      }

      // 대화 상대별로 그룹화 (마지막 메시지만)
      const conversations = new Map();
      messages?.forEach((message: any) => {
        const isSender = message.sender_id === userId;
        const otherUser = isSender ? message.receiver : message.sender;
        const key = otherUser.id;

        if (!conversations.has(key)) {
          conversations.set(key, {
            otherUser: {
              ...otherUser,
              profileImage: otherUser.profile_image,
            },
            lastMessage: {
              ...message,
              senderId: message.sender_id,
              receiverId: message.receiver_id,
              createdAt: message.created_at,
            },
            unreadCount: 0,
          });
        }

        // 읽지 않은 메시지 카운트
        if (message.receiver_id === userId && !message.read) {
          const conv = conversations.get(key);
          conv.unreadCount++;
        }
      });

      return NextResponse.json(Array.from(conversations.values()));
    }
  } catch (error) {
    console.error("메시지 조회 실패:", error);
    return NextResponse.json(
      { error: "메시지 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/messages - 메시지 전송
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  try {
    const { senderId, receiverId, content } = await request.json();

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: "필수 필드를 모두 입력해주세요" },
        { status: 400 }
      );
    }

    // VIP 회원 확인 (VIP 회원은 무제한 메시지)
    const { data: senderData, error: senderCheckError } = await supabase
      .from('users')
      .select('points, is_vip, vip_until')
      .eq('id', senderId)
      .single();

    if (senderCheckError || !senderData) {
      return NextResponse.json(
        { error: "발신자 정보를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is VIP and VIP is not expired
    const isVIP = senderData.is_vip && senderData.vip_until && new Date(senderData.vip_until) > new Date();
    const POINT_COST = isVIP ? 0 : GameSettings.messaging.points; // 메시지 전송 비용 from config

    // 발신자의 포인트 확인 (VIP가 아닌 경우에만)
    if (!isVIP) {
      if (senderData.points < POINT_COST) {
        return NextResponse.json(
          { error: `포인트가 부족합니다. 메시지 전송에 ${POINT_COST} 포인트가 필요합니다.` },
          { status: 400 }
        );
      }

      // 포인트 차감
      const { error: pointError } = await supabase
        .from('users')
        .update({ points: senderData.points - POINT_COST })
        .eq('id', senderId);

      if (pointError) {
        throw pointError;
      }
    }

    // 메시지 전송
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        pointCost: POINT_COST,
      })
      .select(`
        *,
        sender:users!sender_id (
          id,
          name,
          nickname,
          profile_image
        ),
        receiver:users!receiver_id (
          id,
          name,
          nickname,
          profile_image
        )
      `)
      .single();

    if (error || !message) {
      console.error("메시지 전송 실패:", error);
      return NextResponse.json(
        { error: "메시지 전송에 실패했습니다" },
        { status: 500 }
      );
    }

    // 포인트 거래 내역 기록 (VIP가 아닌 경우에만)
    if (!isVIP && POINT_COST > 0) {
      await supabase
        .from('point_transactions')
        .insert({
          userId: senderId,
          amount: -POINT_COST,
          transactionType: 'SPEND',
          reason: '메시지 전송',
          relatedId: message.id,
          relatedType: 'message',
        });
    }

    return NextResponse.json({
      ...message,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      createdAt: message.created_at,
      sender: message.sender ? {
        ...message.sender,
        profileImage: message.sender.profile_image,
      } : null,
      receiver: message.receiver ? {
        ...message.receiver,
        profileImage: message.receiver.profile_image,
      } : null,
    }, { status: 201 });
  } catch (error) {
    console.error("메시지 전송 실패:", error);
    return NextResponse.json(
      { error: "메시지 전송에 실패했습니다" },
      { status: 500 }
    );
  }
}
