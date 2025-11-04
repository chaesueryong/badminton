import { NextRequest, NextResponse } from 'next/server';
import { optimizeProfileImage, validateFileSize, validateImageType } from '@/lib/imageOptimizer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'profile'; // profile, post, gym

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // MIME 타입 검증
    if (!validateImageType(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP, GIF만 가능)' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (5MB)
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: '파일 크기는 5MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 이미지 최적화
    let optimizedBuffer: Buffer;
    if (type === 'profile') {
      optimizedBuffer = await optimizeProfileImage(buffer);
    } else {
      // 다른 타입도 프로필 최적화 사용 (나중에 확장 가능)
      optimizedBuffer = await optimizeProfileImage(buffer);
    }

    // 최적화된 이미지를 Blob으로 반환
    return new NextResponse(new Uint8Array(optimizedBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': optimizedBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      { error: '이미지 최적화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
