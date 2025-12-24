import { NextRequest } from 'next/server';
import { getVodSourcesFromDB } from '@/lib/vod-sources-db';
import { VodSource } from '@/types/drama';

interface VodItem {
  id: string | number;
  name: string;
  type_name?: string;
  year?: string | number;
  area?: string;
  remarks?: string;
}

interface MatchResult {
  source_key: string;
  source_name: string;
  vod_id: string | number;
  vod_name: string;
  match_confidence: 'high' | 'medium' | 'low';
  priority: number;  // 视频源优先级
}

// 外部API响应格式
interface DramaListResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: number;
  total: number;
  list: Array<{
    vod_id: number;
    vod_name: string;
    type_name?: string;
    vod_year?: string;
    vod_area?: string;
    vod_remarks?: string;
  }>;
}

// 计算匹配置信度
function getMatchConfidence(vodName: string, title: string): 'high' | 'medium' | 'low' {
  const normalizedVodName = vodName.toLowerCase().trim();
  const normalizedTitle = title.toLowerCase().trim();
  
  if (normalizedVodName === normalizedTitle) {
    return 'high';
  }
  
  if (normalizedVodName.includes(normalizedTitle) || normalizedTitle.includes(normalizedVodName)) {
    return 'medium';
  }
  
  return 'low';
}

// 搜索单个视频源
async function searchSingleSource(
  origin: string,
  source: VodSource,
  title: string
): Promise<MatchResult | null> {
  try {
    // 直接调用 drama/list API，不使用 origin（服务端直接调用）
    // 构建 API 请求参数
    const apiParams: Record<string, string> = {
      ac: 'detail',
      pg: '1',
    };

    // 如果有关键词，添加搜索参数
    if (title) {
      apiParams.wd = title;
    }

    // 构建查询字符串
    const queryString = new URLSearchParams(apiParams).toString();
    const apiUrl = `${source.api}?${queryString}`;

    // 直接调用外部影视API，设置正确的Referer
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // 设置Referer为资源主站地址，而不是zeabur地址
        'Referer': new URL(source.api).origin + '/',
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    });
    
    if (!response.ok) {
      return null;
    }
    
    // 读取响应文本
    const responseText = await response.text();
    
    // 如果是XML或HTML响应，直接返回空结果
    if (responseText.startsWith('<?xml') || responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      return null;
    }
    
    // 解析JSON
    let data: DramaListResponse;
    try {
      data = JSON.parse(responseText);
    } catch {
      return null;
    }
    
    // 检查API响应
    if (data.code !== 1 || !data.list || data.list.length === 0) {
      return null;
    }
    
    // 查找最匹配的结果
    const list: VodItem[] = data.list.map(item => ({
      id: item.vod_id,
      name: item.vod_name,
      type_name: item.type_name,
      year: item.vod_year,
      area: item.vod_area,
      remarks: item.vod_remarks,
    }));
      
      // 优先精确匹配
      let bestMatch = list.find(item => 
        item.name.toLowerCase().trim() === title.toLowerCase().trim()
      );
      
      // 其次包含匹配
      if (!bestMatch) {
        bestMatch = list.find(item =>
          item.name.toLowerCase().includes(title.toLowerCase()) ||
          title.toLowerCase().includes(item.name.toLowerCase())
        );
      }
      
      // 使用第一个结果
      if (!bestMatch && list.length > 0) {
        bestMatch = list[0];
      }
      
      if (bestMatch) {
        return {
          source_key: source.key,
          source_name: source.name,
          vod_id: bestMatch.id,
          vod_name: bestMatch.name,
          match_confidence: getMatchConfidence(bestMatch.name, title),
          priority: source.priority ?? 999,  // 未设置优先级的排在最后
        };
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get('title');
  const doubanId = searchParams.get('douban_id');
  
  if (!title) {
    return new Response('Missing title parameter', { status: 400 });
  }
  
  // 获取所有视频源
  const allSources = await getVodSourcesFromDB();
  
  if (allSources.length === 0) {
    return new Response('No video sources configured', { status: 404 });
  }
  
  const origin = request.nextUrl.origin;
  
  // 创建 SSE 流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 发送初始化信息
      const initData = {
        type: 'init',
        doubanId,
        title,
        totalSources: allSources.length,
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initData)}\n\n`));
      
      console.log(`\n🔍 开始流式搜索视频源: ${title}`);
      
      let completedCount = 0;
      let foundCount = 0;
      
      // 并行搜索所有源，但每个完成后立即发送结果
      const promises = allSources.map(async (source) => {
        try {
          const result = await searchSingleSource(origin, source, title);
          completedCount++;
          
          if (result) {
            foundCount++;
            console.log(`  ✅ ${source.name} 找到: ${result.vod_name}`);
          } else {
            console.log(`  ❌ ${source.name} 未找到`);
          }
          
          // 发送单个源的结果
          const resultData = {
            type: 'result',
            sourceKey: source.key,
            sourceName: source.name,
            match: result,
            completed: completedCount,
            total: allSources.length,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(resultData)}\n\n`));
        } catch (error) {
          completedCount++;
          console.error(`  ❌ ${source.name} 搜索出错:`, error);
          
          // 发送错误结果
          const errorData = {
            type: 'result',
            sourceKey: source.key,
            sourceName: source.name,
            match: null,
            completed: completedCount,
            total: allSources.length,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
        }
      });
      
      // 等待所有搜索完成
      await Promise.all(promises);
      
      console.log(`\n📊 搜索完成: 找到 ${foundCount} 个可用源\n`);
      
      // 发送完成信号
      const doneData = {
        type: 'done',
        totalSources: allSources.length,
        foundCount,
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneData)}\n\n`));
      
      controller.close();
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
