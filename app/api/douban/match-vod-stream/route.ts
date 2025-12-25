import { NextRequest } from 'next/server';
import { getVodSourcesFromDB } from '@/lib/vod-sources-db';
import { VodSource } from '@/types/drama';
import { cleanTitleForSearch } from '@/lib/utils/title-utils';

interface DramaListResponse {
  code: number;
  msg: string;
  list: Array<{
    vod_id: number;
    vod_name: string;
    vod_pic?: string;
    vod_remarks?: string;
    type_name?: string;
    vod_time?: string;
    vod_play_from?: string;
    vod_sub?: string;
    vod_actor?: string;
    vod_director?: string;
    vod_area?: string;
    vod_year?: string;
    vod_score?: string;
    vod_total?: number;
    vod_blurb?: string;
    vod_class?: string;
  }>;
}

interface MatchResult {
  source_key: string;
  source_name: string;
  vod_id: string | number;
  vod_name: string;
  match_confidence: 'high' | 'medium' | 'low';
  priority: number;  // 视频源优先级
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

// 搜索单个视频源（参考 search-stream 的实现，直接调用视频源 API）
async function searchSingleSource(
  source: VodSource,
  keyword: string
): Promise<MatchResult | null> {
  try {
    // 构建 API 请求参数（参考 search-stream）
    const apiParams = new URLSearchParams({
      ac: 'detail',
      pg: '1',
      wd: keyword,
    });
    
    const apiUrl = `${source.api}?${apiParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.log(`  ⚠️ ${source.name} API请求失败: HTTP ${response.status}`);
      return null;
    }

    const data: DramaListResponse = await response.json();

    if (data.code !== 1) {
      console.log(`  ⚠️ ${source.name} API返回错误: ${data.msg || '未知错误'}`);
      return null;
    }

    const list = data.list || [];
    
    if (list.length === 0) {
      return null;
    }

    // 查找最匹配的结果
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    // 优先精确匹配
    let bestMatch = list.find(item => 
      item.vod_name.toLowerCase().trim() === normalizedKeyword
    );
    
    // 其次包含匹配
    if (!bestMatch) {
      bestMatch = list.find(item =>
        item.vod_name.toLowerCase().includes(normalizedKeyword) ||
        normalizedKeyword.includes(item.vod_name.toLowerCase())
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
        vod_id: bestMatch.vod_id,
        vod_name: bestMatch.vod_name,
        match_confidence: getMatchConfidence(bestMatch.vod_name, keyword),
        priority: source.priority ?? 999,  // 未设置优先级的排在最后
      };
    }
    
    return null;
  } catch (error) {
    console.error(`  ❌ ${source.name} 搜索出错:`, error instanceof Error ? error.message : error);
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
  
  // 清理标题（移除年份、副标题等，提高搜索匹配率）
  const cleanedTitle = cleanTitleForSearch(title);
  console.log(`\n🔍 开始流式搜索视频源:`);
  console.log(`  原始标题: ${title}`);
  console.log(`  清理后标题: ${cleanedTitle}`);
  
  // 获取所有视频源
  const allSources = await getVodSourcesFromDB();
  
  if (allSources.length === 0) {
    return new Response('No video sources configured', { status: 404 });
  }
  
  // 创建 SSE 流
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 发送初始化信息
      const initData = {
        type: 'init',
        doubanId,
        title,
        cleanedTitle,
        totalSources: allSources.length,
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initData)}\n\n`));
      
      let completedCount = 0;
      let foundCount = 0;
      
      // 并行搜索所有源，但每个完成后立即发送结果
      const promises = allSources.map(async (source) => {
        try {
          // 使用清理后的标题搜索
          const result = await searchSingleSource(source, cleanedTitle);
          completedCount++;
          
          if (result) {
            foundCount++;
            console.log(`  ✅ ${source.name} 找到: ${result.vod_name} (置信度: ${result.match_confidence})`);
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
          console.error(`  ❌ ${source.name} 搜索出错:`, error instanceof Error ? error.message : error);
          
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
      
      console.log(`\n📊 搜索完成: 找到 ${foundCount}/${allSources.length} 个可用源\n`);
      
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
