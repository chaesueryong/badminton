import sharp from 'sharp';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 80,
  format: 'webp',
};

/**
 * 이미지를 최적화합니다 (리사이징, 포맷 변환, 압축)
 * @param buffer 원본 이미지 버퍼
 * @param options 최적화 옵션
 * @returns 최적화된 이미지 버퍼
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    let image = sharp(buffer);

    // 메타데이터 가져오기
    const metadata = await image.metadata();

    // 리사이징 (가로/세로 비율 유지)
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > opts.maxWidth! || metadata.height > opts.maxHeight!)
    ) {
      image = image.resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // 포맷 변환 및 압축
    switch (opts.format) {
      case 'webp':
        image = image.webp({ quality: opts.quality });
        break;
      case 'jpeg':
        image = image.jpeg({ quality: opts.quality });
        break;
      case 'png':
        image = image.png({ quality: opts.quality });
        break;
    }

    // 버퍼로 변환
    return await image.toBuffer();
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error('이미지 최적화에 실패했습니다.');
  }
}

/**
 * 프로필 이미지 최적화 (512x512, WebP, 80% 품질)
 */
export async function optimizeProfileImage(buffer: Buffer): Promise<Buffer> {
  return optimizeImage(buffer, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 80,
    format: 'webp',
  });
}

/**
 * 게시물 이미지 최적화 (1920x1920, WebP, 85% 품질)
 */
export async function optimizePostImage(buffer: Buffer): Promise<Buffer> {
  return optimizeImage(buffer, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    format: 'webp',
  });
}

/**
 * 파일 크기 검증
 * @param size 파일 크기 (바이트)
 * @param maxSize 최대 허용 크기 (바이트, 기본 5MB)
 */
export function validateFileSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
  return size <= maxSize;
}

/**
 * 이미지 MIME 타입 검증
 */
export function validateImageType(mimeType: string): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return allowedTypes.includes(mimeType);
}
