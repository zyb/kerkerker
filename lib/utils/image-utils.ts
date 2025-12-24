// 图片处理工具函数

// 默认占位图
const DEFAULT_PLACEHOLDER = '/movie-default-bg.jpg';

/**
 * 检查是否是 TMDB 图片 URL
 */
function isTMDBImageUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('image.tmdb.org') || urlObj.hostname.includes('themoviedb.org');
  } catch {
    return false;
  }
}

/**
 * 智能获取图片URL
 * - TMDB 图片：使用代理 API 设置正确的 Referer
 * - 其他图片：直接返回原始URL（媒体资源支持跨域访问）
 */
export function getImageUrl(imageUrl: string): string {
  // 空URL返回占位图
  if (!imageUrl || imageUrl.trim() === '') {
    return DEFAULT_PLACEHOLDER;
  }
  
  // TMDB 图片需要通过代理设置正确的 Referer
  if (isTMDBImageUrl(imageUrl)) {
    return `/api/tmdb-image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // 其他图片直接返回原始URL，不走代理（媒体资源支持跨域访问）
  return imageUrl;
}

/**
 * 从资源URL中提取主站地址（用于设置Referer）
 * 例如：https://example.com/path/image.jpg -> https://example.com/
 */
export function getResourceOrigin(imageUrl: string): string | null {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }
  
  try {
    const url = new URL(imageUrl);
    return `${url.protocol}//${url.host}/`;
  } catch {
    return null;
  }
}
