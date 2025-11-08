"use client";

import { useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

interface ImageUploadProps {
  bucket: string;
  path?: string;
  onUpload: (url: string, path: string) => void;
  currentImage?: string;
}

export default function ImageUpload({
  bucket,
  path,
  onUpload,
  currentImage,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    // 이미지 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP, GIF만 가능)");
      return;
    }

    setUploading(true);

    try {
      // 1. 이미지 최적화 API 호출
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', bucket === 'profiles' ? 'profile' : 'post');

      const optimizeResponse = await fetch('/api/upload/optimize', {
        method: 'POST',
        body: formData,
      });

      if (!optimizeResponse.ok) {
        const errorData = await optimizeResponse.json();
        throw new Error(errorData.error || '이미지 최적화에 실패했습니다');
      }

      // 2. 최적화된 이미지를 Blob으로 변환
      const optimizedBlob = await optimizeResponse.blob();
      const optimizedFile = new File(
        [optimizedBlob],
        file.name.replace(/\.[^/.]+$/, '.webp'),
        { type: 'image/webp' }
      );

      // 3. 미리보기
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(optimizedFile);

      // 4. Supabase에 업로드 (인증된 클라이언트 사용)
      const fileExt = optimizedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, optimizedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message || '이미지 업로드에 실패했습니다');
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onUpload(publicUrl, data.path);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {preview && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-300">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover-hover:hover:bg-blue-700 transition disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : preview ? "이미지 변경" : "이미지 선택"}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            JPG, PNG, WebP, GIF 파일 (최대 5MB)
            <br />
            <span className="text-xs text-gray-400">업로드 시 자동으로 최적화됩니다</span>
          </p>
        </div>
      </div>
    </div>
  );
}
