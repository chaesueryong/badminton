"use client";

import { useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Camera } from "lucide-react";
import { toast } from "sonner";

interface SimpleImageUploadProps {
  bucket: string;
  currentImage?: string;
  onImageUpload: (url: string) => void;
  className?: string;
}

export default function SimpleImageUpload({
  bucket,
  currentImage,
  onImageUpload,
  className = "w-full h-64",
}: SimpleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImage || "");
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
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Supabase에 업로드
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `meetings/${fileName}`;

      // First try to create the bucket if it doesn't exist
      // This will fail silently if the bucket already exists
      await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      }).catch(() => {
        // Ignore error if bucket already exists
      });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        // If bucket doesn't exist, use profiles bucket as fallback
        if (error.message.includes('not found') && bucket === 'meetings') {
          const { data: fallbackData, error: fallbackError } = await supabase.storage
            .from('profiles')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (fallbackError) {
            throw new Error(fallbackError.message || '이미지 업로드에 실패했습니다');
          }

          const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(fallbackData.path);

          onImageUpload(publicUrl);
        } else {
          throw new Error(error.message || '이미지 업로드에 실패했습니다');
        }
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        onImageUpload(publicUrl);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다");
      setPreview(currentImage || "");
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className} bg-gray-100 rounded-lg overflow-hidden cursor-pointer group`} onClick={handleClick}>
      {preview ? (
        <>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-white text-center">
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">이미지 변경</span>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
          <Camera className="w-12 h-12 mb-2" />
          <span className="text-sm">이미지 업로드</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <span className="text-sm text-gray-600 mt-2 block">업로드 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}