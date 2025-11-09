"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type ClubMember = {
  id: string;
  role: "owner" | "manager" | "member";
  joined_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    nickname: string;
    profile_image?: string;
  };
};

type Club = {
  id: string;
  name: string;
  description: string;
  region: string;
  level: string;
  owner_id: string;
  max_members: number;
  member_count: number;
  created_at: string;
};

const roleLabels = {
  owner: "모임장",
  manager: "매니저",
  member: "멤버",
};

const levelLabels: Record<string, string> = {
  E_GRADE: "E조",
  D_GRADE: "D조",
  C_GRADE: "C조",
  B_GRADE: "B조",
  A_GRADE: "A조",
  S_GRADE: "자강",
};

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);

    // 사용자 세션 확인
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    // 클럽 정보 조회
    const { data: clubData, error: clubError } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", params.id)
      .single();

    if (clubError || !clubData) {
      console.error(clubError);
      setLoading(false);
      return;
    }

    setClub(clubData);

    // 멤버 목록 조회
    const { data: membersData, error: membersError } = await supabase
      .from("club_members")
      .select(
        `
        id,
        role,
        joined_at,
        user:users (
          id,
          name,
          email,
          nickname,
          profile_image
        )
      `
      )
      .eq("club_id", params.id)
      .order("joined_at", { ascending: true });

    if (!membersError && membersData) {
      setMembers(membersData as any);

      // 현재 사용자의 역할 확인
      if (session?.user) {
        const currentMember = membersData.find(
          (m: any) => m.user.id === session.user.id
        );
        setCurrentUserRole((currentMember as any)?.role ?? null);
      }
    }

    setLoading(false);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const response = await fetch(
      `/api/clubs/${params.id}/members/${memberId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      }
    );

    if (response.ok) {
      await loadData();
      alert("역할이 변경되었습니다.");
    } else {
      const error = await response.json();
      alert(error.error || "역할 변경에 실패했습니다.");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("정말 이 멤버를 제거하시겠습니까?")) return;

    const response = await fetch(
      `/api/clubs/${params.id}/members/${memberId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      await loadData();
      alert("멤버가 제거되었습니다.");
    } else {
      const error = await response.json();
      alert(error.error || "멤버 제거에 실패했습니다.");
    }
  };

  const handleJoinClub = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    const response = await fetch(`/api/clubs/${params.id}/join`, {
      method: "POST",
    });

    if (response.ok) {
      await loadData();
      alert("클럽에 가입했습니다!");
    } else {
      const error = await response.json();
      alert(error.error || "가입에 실패했습니다.");
    }
  };

  const handleLeaveClub = async () => {
    if (!confirm("정말 이 클럽을 탈퇴하시겠습니까?")) return;

    const response = await fetch(`/api/clubs/${params.id}/join`, {
      method: "DELETE",
    });

    if (response.ok) {
      await loadData();
      alert("클럽을 탈퇴했습니다.");
    } else {
      const error = await response.json();
      alert(error.error || "탈퇴에 실패했습니다.");
    }
  };

  const isOwner = currentUserRole === "owner";
  const isManager = currentUserRole === "manager";
  const isMember = currentUserRole !== null;
  const canManageMembers = isOwner || isManager;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">클럽을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push("/clubs")}
            className="mt-4 text-blue-600 hover:underline"
          >
            클럽 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 클럽 헤더 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {club.region}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {levelLabels[club.level]}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {members.length}/{club.max_members}명
              </span>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-lg font-semibold mb-2">소개</h2>
            <p className="text-gray-700">{club.description}</p>

            <div className="mt-6 flex gap-2">
              {/* 가입/탈퇴 버튼 */}
              {user && !isMember && (
                <button
                  onClick={handleJoinClub}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  클럽 가입하기
                </button>
              )}

              {isMember && !isOwner && (
                <button
                  onClick={handleLeaveClub}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  클럽 탈퇴
                </button>
              )}

              {/* 모임장/매니저 전용 버튼 */}
              {canManageMembers && (
                <>
                  <button
                    onClick={() => router.push(`/clubs/${club.id}/edit`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    클럽 수정
                  </button>
                  {isOwner && (
                    <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
                      클럽 삭제
                    </button>
                  )}
                </>
              )}

              {!user && (
                <button
                  onClick={() => router.push("/login")}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  로그인 후 가입하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">멤버 ({members.length}명)</h2>
            {canManageMembers && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                멤버 초대
              </button>
            )}
          </div>

          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {member.user.name?.[0] || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{member.user.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          member.role === "owner"
                            ? "bg-yellow-100 text-yellow-800"
                            : member.role === "manager"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {roleLabels[member.role]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      @{member.user.nickname || member.user.email}
                    </p>
                  </div>
                </div>

                {/* 모임장 전용: 역할 변경 및 제거 버튼 */}
                {isOwner && member.role !== "owner" && (
                  <div className="flex gap-2">
                    {member.role === "member" ? (
                      <button
                        onClick={() => handleRoleChange(member.id, "manager")}
                        className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition"
                      >
                        매니저 임명
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(member.id, "member")}
                        className="text-sm bg-gray-50 text-gray-600 px-3 py-1 rounded hover:bg-gray-100 transition"
                      >
                        매니저 해임
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100 transition"
                    >
                      제거
                    </button>
                  </div>
                )}

                {/* 매니저: 일반 멤버만 제거 가능 */}
                {isManager &&
                  !isOwner &&
                  member.role === "member" &&
                  member.user.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100 transition"
                    >
                      제거
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
