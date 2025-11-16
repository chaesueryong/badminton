import { createClient } from './supabase/client'

export const STORAGE_BUCKETS = {
  PROFILES: 'profiles',
  POSTS: 'posts',
  GYMS: 'gyms',
} as const

// 이미지 업로드
export async function uploadImage(
  file: File,
  bucket: string,
  path?: string
): Promise<{ url: string; path: string } | null> {
  try {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = path ? `${path}/${fileName}` : fileName

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      url: publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('Upload failed:', error)
    return null
  }
}

// 이미지 삭제
export async function deleteImage(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete failed:', error)
    return false
  }
}

// 이미지 URL 가져오기
export function getImageUrl(bucket: string, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// 여러 이미지 업로드
export async function uploadImages(
  files: File[],
  bucket: string,
  path?: string
): Promise<Array<{ url: string; path: string }>> {
  const results = await Promise.all(
    files.map((file) => uploadImage(file, bucket, path))
  )
  return results.filter((result) => result !== null) as Array<{
    url: string
    path: string
  }>
}
