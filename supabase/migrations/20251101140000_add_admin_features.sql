-- ============================================
-- Admin Features Migration
-- 어드민 기능 추가를 위한 데이터베이스 마이그레이션
-- ============================================

-- ============================================
-- 1. Users 테이블에 role 및 status 컬럼 추가
-- ============================================

-- role 컬럼 추가 (user 또는 admin)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin'));

-- status 컬럼 추가 (active, suspended, inactive)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'suspended', 'inactive'));

-- role 및 status 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================
-- 2. Reports 테이블 생성 (신고 관리)
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 신고 대상 정보
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'meeting', 'user', 'comment')),
  target_id UUID NOT NULL,

  -- 신고자 정보
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 신고 내용
  reason TEXT NOT NULL CHECK (reason IN (
    '부적절한 내용',
    '사기/허위',
    '괴롭힘',
    '스팸/광고',
    '중복',
    '기타'
  )),
  description TEXT,

  -- 처리 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),

  -- 처리 정보
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- RLS 활성화
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인이 작성한 신고만 조회 가능
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- RLS 정책: 어드민은 모든 신고 조회 가능
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS 정책: 인증된 사용자는 신고 생성 가능
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- RLS 정책: 어드민만 신고 상태 변경 가능
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================
-- 3. Admin Logs 테이블 생성 (감사 로그)
-- ============================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 관리자 정보
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 액션 정보
  action TEXT NOT NULL, -- 'suspend_user', 'delete_post', 'approve_gym', 'resolve_report' 등
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'post', 'meeting', 'gym', 'report', 'comment')),
  target_id UUID NOT NULL,

  -- 액션 상세 내용
  details JSONB,

  -- IP 주소 (선택)
  ip_address INET,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- RLS 활성화
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 어드민만 로그 조회 가능
CREATE POLICY "Only admins can view logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS 정책: 어드민만 로그 생성 가능
CREATE POLICY "Only admins can create logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    ) AND auth.uid() = admin_id
  );

-- ============================================
-- 4. Notifications 테이블 생성 (알림)
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 수신자 정보
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 알림 유형
  type TEXT NOT NULL CHECK (type IN (
    'account_suspended',
    'account_activated',
    'report_resolved',
    'report_dismissed',
    'post_removed',
    'comment_removed',
    'meeting_cancelled',
    'gym_approved',
    'gym_rejected',
    'system'
  )),

  -- 알림 내용
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- 관련 링크 (선택)
  link TEXT,

  -- 읽음 상태
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인의 알림만 조회 가능
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 정책: 어드민은 모든 사용자에게 알림 생성 가능
CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS 정책: 본인의 알림만 업데이트 가능 (읽음 처리)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인의 알림만 삭제 가능
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Posts 및 Meetings 테이블에 status 컬럼 추가
-- ============================================

-- Post 테이블에 status 컬럼 추가
ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
CHECK (status IN ('published', 'hidden', 'deleted'));

-- Post status 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_status ON "Post"(status);

-- Meeting 테이블에 admin_note 컬럼 추가 (어드민 메모)
ALTER TABLE "Meeting"
ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Gym 테이블에 approval_status 컬럼 추가 (이미 있을 수도 있음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Gym' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE "Gym"
    ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

    CREATE INDEX idx_gyms_approval_status ON "Gym"(approval_status);
  END IF;
END $$;

-- ============================================
-- 6. Triggers for updated_at
-- ============================================

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Realtime 활성화
-- ============================================

-- Notifications 테이블에 대한 Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- 8. Admin RLS 정책 추가 (기존 테이블)
-- ============================================

-- 어드민은 모든 사용자 정보 수정 가능
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- 어드민은 모든 게시글 수정/삭제 가능
CREATE POLICY "Admins can update all posts"
  ON "Post" FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all posts"
  ON "Post" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 어드민은 모든 모임 삭제 가능
CREATE POLICY "Admins can delete all meetings"
  ON "Meeting" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all meetings"
  ON "Meeting" FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 어드민은 모든 체육관 수정 가능
CREATE POLICY "Admins can update all gyms"
  ON "Gym" FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all gyms"
  ON "Gym" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 어드민은 모든 댓글 삭제 가능
CREATE POLICY "Admins can delete all comments"
  ON "Comment" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================
-- 완료
-- ============================================

-- 마이그레이션 완료
-- 이 파일을 실행하면 어드민 기능을 위한 모든 데이터베이스 구조가 생성됩니다.
