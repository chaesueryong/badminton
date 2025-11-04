# 토스페이먼츠 결제 연동 가이드

## 1. 토스페이먼츠 가입 및 설정

### 1.1 회원가입
1. https://www.tosspayments.com 접속
2. 회원가입 후 로그인
3. 개발자센터 접속

### 1.2 테스트 키 발급
1. 개발자센터 > 내 개발 정보
2. **클라이언트 키** 복사
3. **시크릿 키** 복사

### 1.3 환경 변수 설정

`.env.local`에 추가:

```env
# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_ck_..."
TOSS_SECRET_KEY="test_sk_..."
```

## 2. 결제 테스트

### 2.1 테스트 카드 번호

| 카드사 | 카드번호 | 유효기간 | CVC |
|--------|----------|----------|-----|
| 신한카드 | 5580****0000**** | 아무 값 | 아무 값 |
| KB국민카드 | 9430****0000**** | 아무 값 | 아무 값 |
| 현대카드 | 9410****0000**** | 아무 값 | 아무 값 |

### 2.2 결제 테스트 흐름

```
1. 모임 참가 신청
   ↓
2. 결제 페이지 (/payments/{meetingId})
   ↓
3. 카드 정보 입력
   ↓
4. 토스페이먼츠 결제창
   ↓
5. 성공: /payments/success
   실패: /payments/fail
```

## 3. 결제 기능 구현

### 3.1 모임 참가비 결제

```typescript
import { requestPayment, generateOrderId } from '@/lib/payment'

// 결제 요청
const handlePayment = async () => {
  const orderId = generateOrderId()

  await requestPayment({
    amount: 15000,
    orderId,
    orderName: '강남 배드민턴 모임 참가비',
    customerName: '홍길동',
    customerEmail: 'test@example.com',
    successUrl: `${window.location.origin}/payments/success`,
    failUrl: `${window.location.origin}/payments/fail`,
  })
}
```

### 3.2 결제 승인

결제 성공 시 `/payments/success` 페이지에서 자동으로 승인 처리됩니다.

### 3.3 결제 취소

```typescript
import { cancelPayment } from '@/lib/payment'

await cancelPayment(paymentKey, '단순 변심')
```

## 4. 프로덕션 배포

### 4.1 실제 키 발급
1. 토스페이먼츠 대시보드
2. 사업자 정보 등록
3. 심사 완료 후 실제 키 발급

### 4.2 환경 변수 변경
```env
NEXT_PUBLIC_TOSS_CLIENT_KEY="live_ck_..."
TOSS_SECRET_KEY="live_sk_..."
```

### 4.3 PG사 계약
- 사업자등록증 필요
- 정산 계좌 등록
- 수수료: 3.3% (일반적)

## 5. 결제 데이터베이스 스키마

```prisma
model Payment {
  id          String   @id @default(cuid())
  orderId     String   @unique
  paymentKey  String
  amount      Int
  status      PaymentStatus
  method      String?

  approvedAt  DateTime?
  cancelledAt DateTime?
  cancelReason String?

  metadata    Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("payments")
}

enum PaymentStatus {
  PENDING
  COMPLETED
  CANCELLED
  FAILED
}
```

## 6. API 엔드포인트

### POST /api/payments/confirm
결제 승인

**Request:**
```json
{
  "paymentKey": "string",
  "orderId": "string",
  "amount": 15000
}
```

### POST /api/payments/cancel
결제 취소

**Request:**
```json
{
  "paymentKey": "string",
  "cancelReason": "string"
}
```

## 7. 보안 주의사항

1. **절대 클라이언트에 시크릿 키 노출 금지**
   - TOSS_SECRET_KEY는 서버에서만 사용
   - NEXT_PUBLIC으로 시작하지 않도록 주의

2. **금액 검증**
   - 서버에서 항상 결제 금액 재검증
   - 클라이언트에서 받은 금액 그대로 사용 금지

3. **중복 결제 방지**
   - orderId 중복 체크
   - 결제 상태 확인 후 처리

## 8. 문제 해결

### 결제 실패

**원인:**
- 잘못된 카드 번호
- 한도 초과
- 카드 정지

**해결:**
- 테스트 환경: 테스트 카드 번호 사용
- 실제 환경: 고객에게 카드사 확인 요청

### 결제 승인 실패

**원인:**
- 네트워크 오류
- 잘못된 시크릿 키
- 금액 불일치

**해결:**
- 환경 변수 확인
- 네트워크 연결 확인
- 로그 확인

## 9. 참고 자료

- [토스페이먼츠 공식 문서](https://docs.tosspayments.com/)
- [결제 SDK 가이드](https://docs.tosspayments.com/reference/js-sdk)
- [API 레퍼런스](https://docs.tosspayments.com/reference)
