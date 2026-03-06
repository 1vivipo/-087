import { NextRequest, NextResponse } from 'next/server';
import { addKnowledgeItem } from '@/lib/knowledge-store';
import ZAI from 'z-ai-web-dev-sdk';

// 网络搜索学习
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, searchType = 'general', autoLearn = true } = body;

    console.log('[学习请求] 主题:', topic, '类型:', searchType);

    if (!topic) {
      return NextResponse.json({ success: false, error: '请提供学习主题' }, { status: 400 });
    }

    // 初始化 AI
    const zai = await ZAI.create();
    console.log('[AI] 初始化成功');

    // 构建搜索查询
    let searchQuery = topic;
    if (searchType === 'book') {
      searchQuery = `${topic} 书籍 推荐 内容介绍`;
    } else if (searchType === 'video') {
      searchQuery = `${topic} 视频 教程`;
    } else if (searchType === 'article') {
      searchQuery = `${topic} 文章 技巧 方法`;
    }

    console.log('[搜索] 查询:', searchQuery);

    // 执行网络搜索
    let searchResult;
    try {
      searchResult = await zai.functions.invoke('web_search', {
        query: searchQuery,
        num: 10
      });
      console.log('[搜索] 结果数量:', searchResult?.length || 0);
    } catch (searchError: any) {
      console.error('[搜索] 失败:', searchError.message);
      // 如果搜索失败，使用AI直接生成内容
      return await generateWithAI(zai, topic, autoLearn);
    }

    if (!searchResult || searchResult.length === 0) {
      console.log('[搜索] 无结果，使用AI生成');
      return await generateWithAI(zai, topic, autoLearn);
    }

    // 整理搜索结果
    const searchResults = searchResult.map((item: any) => ({
      url: item.url || '',
      title: item.name || '未知标题',
      snippet: item.snippet || '',
      source: item.host_name || ''
    }));

    // 如果启用自动学习，使用 AI 整理并添加到知识库
    const learnedItems = [];
    
    if (autoLearn && searchResults.length > 0) {
      // 合并搜索结果内容
      const combinedContent = searchResults.slice(0, 5).map((r: any) => 
        `【${r.title}】\n来源: ${r.source}\n链接: ${r.url}\n摘要: ${r.snippet}`
      ).join('\n\n');

      console.log('[AI] 开始整理内容...');

      // 使用 AI 整理和总结
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            { 
              role: 'system', 
              content: `你是一个恋爱技巧和社交知识专家。请根据搜索结果，整理出关于"${topic}"的核心知识点。
要求：
1. 提取有价值的信息，整理成实用的技巧和方法
2. 内容要详细、可操作
3. 返回JSON格式`
            },
            { 
              role: 'user', 
              content: `主题: ${topic}\n\n搜索结果:\n${combinedContent}\n\n请整理成知识库条目，返回JSON格式：
{
  "title": "标题",
  "content": "整理后的完整内容（详细、结构化，包含具体方法和技巧）",
  "summary": "简短摘要",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "category": "分类",
  "tags": ["标签1", "标签2"]
}`
            }
          ]
        });

        const responseText = completion.choices[0]?.message?.content || '';
        console.log('[AI] 响应长度:', responseText.length);
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          const item = addKnowledgeItem({
            title: parsed.title || `关于"${topic}"的网络学习`,
            content: parsed.content || combinedContent,
            source: 'web',
            sourceType: 'url',
            sourceUrl: searchResults[0]?.url,
            category: parsed.category || '网络学习',
            tags: parsed.tags || [topic],
            summary: parsed.summary,
            keyPoints: parsed.keyPoints
          });
          
          learnedItems.push(item);
          console.log('[知识库] 添加成功:', item.title);
        }
      } catch (aiError: any) {
        console.error('[AI] 处理失败:', aiError.message);
        // 如果AI处理失败，直接添加原始内容
        const item = addKnowledgeItem({
          title: `关于"${topic}"的网络学习`,
          content: combinedContent,
          source: 'web',
          sourceType: 'url',
          sourceUrl: searchResults[0]?.url,
          category: '网络学习',
          tags: [topic],
          summary: `从网络搜索获取的关于"${topic}"的相关信息`
        });
        learnedItems.push(item);
      }
    }

    return NextResponse.json({ 
      success: true, 
      searchResults,
      learnedItems,
      message: autoLearn 
        ? `已搜索并学习了关于"${topic}"的知识` 
        : `已搜索到 ${searchResults.length} 条相关内容`
    });
  } catch (error: any) {
    console.error('[API] 网络学习失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: `网络学习失败: ${error.message || '未知错误'}` 
    }, { status: 500 });
  }
}

// 使用AI直接生成内容（当搜索失败时）
async function generateWithAI(zai: any, topic: string, autoLearn: boolean) {
  console.log('[AI生成] 开始为主题生成内容:', topic);
  
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: `你是一个恋爱技巧和社交知识专家。请生成关于给定主题的详细知识内容。
要求：
1. 内容要详细、实用、可操作
2. 包含具体的技巧、方法和案例
3. 返回JSON格式`
        },
        { 
          role: 'user', 
          content: `请生成关于"${topic}"的详细知识内容，返回JSON格式：
{
  "title": "标题",
  "content": "详细内容（包含具体方法、技巧、案例）",
  "summary": "简短摘要",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "category": "分类",
  "tags": ["标签1", "标签2"]
}`
        }
      ]
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (autoLearn) {
        const item = addKnowledgeItem({
          title: parsed.title || topic,
          content: parsed.content,
          source: 'web',
          category: parsed.category || 'AI生成',
          tags: parsed.tags || [topic],
          summary: parsed.summary,
          keyPoints: parsed.keyPoints
        });
        
        console.log('[知识库] AI生成添加成功:', item.title);
        
        return NextResponse.json({ 
          success: true, 
          searchResults: [],
          learnedItems: [item],
          message: `AI已生成关于"${topic}"的知识`
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        searchResults: [],
        learnedItems: [],
        generatedContent: parsed,
        message: `AI已生成关于"${topic}"的内容`
      });
    }
    
    throw new Error('AI响应解析失败');
  } catch (error: any) {
    console.error('[AI生成] 失败:', error);
    throw error;
  }
}
