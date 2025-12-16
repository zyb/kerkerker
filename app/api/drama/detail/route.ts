import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, DramaDetail, Episode } from '@/types/drama';

interface DetailResponse {
  code: number;
  msg?: string;
  list?: Array<{
    vod_id: number;
    vod_name: string;
    vod_pic?: string;
    vod_remarks?: string;
    type_name?: string;
    vod_play_url?: string;
    vod_play_from?: string;
    vod_actor?: string;
    vod_director?: string;
    vod_content?: string;
    vod_area?: string;
    vod_year?: string;
    vod_score?: string;
  }>;
}

function parseEpisodes(playUrl: string): Episode[] {
  if (!playUrl) return [];

  try {
    // 解析剧集列表
    // 格式通常为: 播放源1$$$播放源2$$$...
    // 每个播放源内部: 第1集$url1#第2集$url2#...
    const sources = playUrl.split('$$$').filter(Boolean);
    
    // 优先使用包含m3u8的播放源
    const m3u8Source = sources.find(source => source.includes('.m3u8'));
    const targetSource = m3u8Source || sources[0];
    
    if (!targetSource) return [];
    
    const episodes: Episode[] = [];
    const episodeList = targetSource.split('#').filter(Boolean);

    for (const episode of episodeList) {
      const [name, url] = episode.split('$');
      if (name && url) {
        episodes.push({ name, url });
      }
    }

    return episodes;
  } catch (error) {
    console.error('Parse episodes error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 构建API请求参数
    const apiParams = new URLSearchParams({
      ac: 'detail',
      ids: body.ids,
    });

    const apiUrl = `${body.source.api}?${apiParams.toString()}`;

    // 调用影视API获取详情
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error('API请求失败');
    }

    const data: DetailResponse = await response.json();

    if (data.code !== 1 || !data.list || data.list.length === 0) {
      throw new Error('获取影视详情失败');
    }

    const item = data.list[0];

    // 解析剧集列表
    const episodes = parseEpisodes(item.vod_play_url || '');

    const dramaDetail: DramaDetail = {
      id: item.vod_id,
      name: item.vod_name,
      pic: item.vod_pic || '',
      remarks: item.vod_remarks || '',
      type: item.type_name || '影视',
      actor: item.vod_actor || '',
      director: item.vod_director || '',
      blurb: item.vod_content || '',
      area: item.vod_area || '',
      year: item.vod_year || '',
      score: item.vod_score || '0.0',
      episodes,
    };

    const result: ApiResponse<DramaDetail> = {
      code: 200,
      msg: 'success',
      data: dramaDetail,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Drama detail API error:', error);

    const errorResult: ApiResponse = {
      code: 500,
      msg: '获取影视详情失败',
    };

    return NextResponse.json(errorResult, { status: 500 });
  }
}
