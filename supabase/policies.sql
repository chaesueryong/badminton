-- Row Level Security (RLS) 정책
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- Users 테이블 RLS 정책
-- ============================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 읽기: 인증된 사용자는 모든 사용자 정보 조회 가능
CREATE POLICY "Anyone can view users"
ON users FOR SELECT
TO authenticated
USING (true);

-- 업데이트: 본인 정보만 수정 가능
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 삭제: 본인 계정만 삭제 가능
CREATE POLICY "Users can delete own account"
ON users FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ============================================
-- Meetings 테이블 RLS 정책
-- ============================================

ALTER TABLE "Meeting" ENABLE ROW LEVEL SECURITY;

-- 읽기: 모두 가능
CREATE POLICY "Anyone can view meetings"
ON "Meeting" FOR SELECT
TO authenticated
USING (true);

-- 생성: 인증된 사용자만
CREATE POLICY "Authenticated users can create meetings"
ON "Meeting" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "hostId");

-- 업데이트: 호스트만
CREATE POLICY "Hosts can update own meetings"
ON "Meeting" FOR UPDATE
TO authenticated
USING (auth.uid() = "hostId")
WITH CHECK (auth.uid() = "hostId");

-- 삭제: 호스트만
CREATE POLICY "Hosts can delete own meetings"
ON "Meeting" FOR DELETE
TO authenticated
USING (auth.uid() = "hostId");

-- ============================================
-- MeetingParticipant 테이블 RLS 정책
-- ============================================

ALTER TABLE "MeetingParticipant" ENABLE ROW LEVEL SECURITY;

-- 읽기: 모두 가능
CREATE POLICY "Anyone can view participants"
ON "MeetingParticipant" FOR SELECT
TO authenticated
USING (true);

-- 생성: 본인만 참가 신청 가능
CREATE POLICY "Users can join meetings"
ON "MeetingParticipant" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

-- 삭제: 본인만 참가 취소 가능
CREATE POLICY "Users can leave meetings"
ON "MeetingParticipant" FOR DELETE
TO authenticated
USING (auth.uid() = "userId");

-- ============================================
-- Posts 테이블 RLS 정책
-- ============================================

ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;

-- 읽기: 모두 가능
CREATE POLICY "Anyone can view posts"
ON "Post" FOR SELECT
TO authenticated
USING (true);

-- 생성: 인증된 사용자만
CREATE POLICY "Authenticated users can create posts"
ON "Post" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "authorId");

-- 업데이트: 작성자만
CREATE POLICY "Authors can update own posts"
ON "Post" FOR UPDATE
TO authenticated
USING (auth.uid() = "authorId")
WITH CHECK (auth.uid() = "authorId");

-- 삭제: 작성자만
CREATE POLICY "Authors can delete own posts"
ON "Post" FOR DELETE
TO authenticated
USING (auth.uid() = "authorId");

-- ============================================
-- Comments 테이블 RLS 정책
-- ============================================

ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

-- 읽기: 모두 가능
CREATE POLICY "Anyone can view comments"
ON "Comment" FOR SELECT
TO authenticated
USING (true);

-- 생성: 인증된 사용자만
CREATE POLICY "Authenticated users can create comments"
ON "Comment" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "authorId");

-- 업데이트: 작성자만
CREATE POLICY "Authors can update own comments"
ON "Comment" FOR UPDATE
TO authenticated
USING (auth.uid() = "authorId")
WITH CHECK (auth.uid() = "authorId");

-- 삭제: 작성자만
CREATE POLICY "Authors can delete own comments"
ON "Comment" FOR DELETE
TO authenticated
USING (auth.uid() = "authorId");

-- ============================================
-- Messages 테이블 RLS 정책
-- ============================================

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- 읽기: 발신자 또는 수신자만
CREATE POLICY "Users can view own messages"
ON "Message" FOR SELECT
TO authenticated
USING (auth.uid() = "senderId" OR auth.uid() = "receiverId");

-- 생성: 인증된 사용자 (발신자만)
CREATE POLICY "Users can send messages"
ON "Message" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "senderId");

-- 업데이트: 수신자만 (읽음 처리)
CREATE POLICY "Recipients can update messages"
ON "Message" FOR UPDATE
TO authenticated
USING (auth.uid() = "receiverId")
WITH CHECK (auth.uid() = "receiverId");

-- 삭제: 발신자 또는 수신자
CREATE POLICY "Users can delete own messages"
ON "Message" FOR DELETE
TO authenticated
USING (auth.uid() = "senderId" OR auth.uid() = "receiverId");

-- ============================================
-- Gyms 테이블 RLS 정책
-- ============================================

ALTER TABLE "Gym" ENABLE ROW LEVEL SECURITY;

-- 읽기: 모두 가능
CREATE POLICY "Anyone can view gyms"
ON "Gym" FOR SELECT
TO authenticated
USING (true);

-- 생성: 인증된 사용자만
CREATE POLICY "Authenticated users can create gyms"
ON "Gym" FOR INSERT
TO authenticated
WITH CHECK (true);

-- 업데이트: 인증된 사용자만
CREATE POLICY "Authenticated users can update gyms"
ON "Gym" FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- GymReviews 테이블 RLS 정책
-- ============================================

ALTER TABLE "GymReview" ENABLE ROW LEVEL SECURITY;

-- 읽기: 모두 가능
CREATE POLICY "Anyone can view gym reviews"
ON "GymReview" FOR SELECT
TO authenticated
USING (true);

-- 생성: 인증된 사용자만
CREATE POLICY "Authenticated users can create reviews"
ON "GymReview" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

-- 업데이트: 작성자만
CREATE POLICY "Users can update own reviews"
ON "GymReview" FOR UPDATE
TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

-- 삭제: 작성자만
CREATE POLICY "Users can delete own reviews"
ON "GymReview" FOR DELETE
TO authenticated
USING (auth.uid() = "userId");

-- ============================================
-- Storage 정책
-- ============================================

-- profiles 버킷
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- posts 버킷
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Authenticated users can delete post images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts');

-- gyms 버킷
CREATE POLICY "Anyone can view gym images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gyms');

CREATE POLICY "Authenticated users can upload gym images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gyms');

CREATE POLICY "Authenticated users can update gym images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gyms')
WITH CHECK (bucket_id = 'gyms');

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- Meetings
CREATE INDEX IF NOT EXISTS idx_meetings_host ON "Meeting"("hostId");
CREATE INDEX IF NOT EXISTS idx_meetings_date ON "Meeting"(date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON "Meeting"(status);
CREATE INDEX IF NOT EXISTS idx_meetings_region ON "Meeting"(location);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_author ON "Post"("authorId");
CREATE INDEX IF NOT EXISTS idx_posts_category ON "Post"(category);
CREATE INDEX IF NOT EXISTS idx_posts_created ON "Post"("createdAt" DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON "Message"("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON "Message"("receiverId");
CREATE INDEX IF NOT EXISTS idx_messages_created ON "Message"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON "Message"("receiverId", read) WHERE read = false;

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_post ON "Comment"("postId");
CREATE INDEX IF NOT EXISTS idx_comments_author ON "Comment"("authorId");

-- ============================================
-- Realtime 활성화
-- ============================================

-- Messages 테이블에 대한 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE "Message";

-- 완료!
-- 이 스크립트를 Supabase Dashboard > SQL Editor에서 실행하세요.
