#!/bin/bash

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 환경 선택
echo -e "${YELLOW}배포 환경을 선택하세요:${NC}"
echo "1) Production (https://badmate.club)"
echo "2) Development (https://dev.badmate.club)"
read -p "선택 (1 or 2): " ENV_CHOICE

if [ "$ENV_CHOICE" = "1" ]; then
    ENV_NAME="production"
    SITE_URL="https://badmate.club"
    CONTAINER_NAME="badminton-prod"
    PORT="3030"
elif [ "$ENV_CHOICE" = "2" ]; then
    ENV_NAME="development"
    SITE_URL="https://dev.badmate.club"
    CONTAINER_NAME="badminton-dev"
    PORT="3031"
else
    echo -e "${RED}잘못된 선택입니다.${NC}"
    exit 1
fi

echo -e "${GREEN}=== $ENV_NAME 환경으로 배포 시작 ===${NC}"

# 환경 변수 파일 확인
ENV_FILE=".env.$ENV_NAME"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}$ENV_FILE 파일이 없습니다!${NC}"
    exit 1
fi

# 환경 변수 로드
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Docker 상태 확인
echo -e "${YELLOW}Docker 상태 확인...${NC}"
docker info > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Docker가 실행중이지 않습니다!${NC}"
    exit 1
fi

# 디스크 공간 확인
echo -e "${YELLOW}디스크 공간 확인...${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo -e "${YELLOW}디스크 사용량이 높습니다 ($DISK_USAGE%). Docker 정리 중...${NC}"
    docker system prune -af --volumes
fi

# 기존 컨테이너 정지
echo -e "${YELLOW}기존 컨테이너 정지...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Docker 이미지 빌드
echo -e "${GREEN}Docker 이미지 빌드 중...${NC}"
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --build-arg NEXT_PUBLIC_SITE_URL="$SITE_URL" \
  --build-arg SITE_URL="$SITE_URL" \
  --build-arg NEXT_PUBLIC_PORTONE_STORE_ID="$NEXT_PUBLIC_PORTONE_STORE_ID" \
  --build-arg PORTONE_API_SECRET="$PORTONE_API_SECRET" \
  --build-arg NEXT_PUBLIC_PORTONE_CHANNEL_KEY_GENERAL="$NEXT_PUBLIC_PORTONE_CHANNEL_KEY_GENERAL" \
  --build-arg NEXT_PUBLIC_PORTONE_CHANNEL_KEY_SUBSCRIPTION="$NEXT_PUBLIC_PORTONE_CHANNEL_KEY_SUBSCRIPTION" \
  --target $ENV_NAME \
  -t $CONTAINER_NAME:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}Docker 이미지 빌드 실패!${NC}"
    exit 1
fi

# 새 컨테이너 실행
echo -e "${GREEN}새 컨테이너 시작...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3000 \
  -e NODE_ENV=$ENV_NAME \
  -e NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e NEXT_PUBLIC_SITE_URL="$SITE_URL" \
  -e SITE_URL="$SITE_URL" \
  -e NEXT_PUBLIC_PORTONE_STORE_ID="$NEXT_PUBLIC_PORTONE_STORE_ID" \
  -e PORTONE_API_SECRET="$PORTONE_API_SECRET" \
  -e NEXT_PUBLIC_PORTONE_CHANNEL_KEY_GENERAL="$NEXT_PUBLIC_PORTONE_CHANNEL_KEY_GENERAL" \
  -e NEXT_PUBLIC_PORTONE_CHANNEL_KEY_SUBSCRIPTION="$NEXT_PUBLIC_PORTONE_CHANNEL_KEY_SUBSCRIPTION" \
  --restart unless-stopped \
  $CONTAINER_NAME:latest

# 컨테이너 상태 확인
echo -e "${YELLOW}컨테이너 상태 확인...${NC}"
sleep 5
if docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${GREEN}✅ 배포 성공!${NC}"
    echo -e "${GREEN}컨테이너가 포트 $PORT에서 실행중입니다.${NC}"
    echo ""
    echo -e "${YELLOW}=== 최근 로그 ===${NC}"
    docker logs --tail 20 $CONTAINER_NAME
else
    echo -e "${RED}❌ 컨테이너 시작 실패!${NC}"
    echo -e "${RED}로그 확인:${NC}"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo ""
echo -e "${GREEN}=== 배포 완료 ===${NC}"
echo -e "로그 확인: ${YELLOW}docker logs -f $CONTAINER_NAME${NC}"
echo -e "컨테이너 상태: ${YELLOW}docker ps | grep $CONTAINER_NAME${NC}"
echo -e "컨테이너 재시작: ${YELLOW}docker restart $CONTAINER_NAME${NC}"