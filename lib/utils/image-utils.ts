// 图片处理工具函数

// 默认占位图
const DEFAULT_PLACEHOLDER = '/movie-default-bg.jpg';

/**
 * 智能获取图片URL - 直接返回原始URL（媒体资源支持跨域访问）
 */
export function getImageUrl(imageUrl: string): string {
  // 空URL返回占位图
  if (!imageUrl || imageUrl.trim() === '') {
    return DEFAULT_PLACEHOLDER;
  }
  // 直接返回原始URL，不走代理（媒体资源支持跨域访问）
  return imageUrl;
}
