import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeContent } from '@/lib/knowledge-store';
import {
  readPracticeData,
  savePracticeData,
  generateRandomGirl,
  getGirlsToPractice,
  updateGirlStatus,
  AIGirl,
  PracticeSession,
  PracticeMessage
} from '@/lib/practice-engine';
import ZAI from 'z-ai-web-dev-sdk';

// 全局练习状态
let isAutoPracticing = false;
let practiceInterval: NodeJS.Timeout | null = null;

// 开始自主练习
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      return await startAutoPractice();
    } else if (action === 'stop') {
      return await stopAutoPractice();
    } else if (action === 'practice_one') {
      return await practiceOneRound();
    } else if (action === 'generate_girls') {
      return await generateNewGirls(body.count || 10);
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    console.error('[自主练习] 错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取练习状态
export async function GET() {
  const data = readPracticeData();
  
  return NextResponse.json({
    success: true,
    status: {
      isAutoPracticing,
      girlsCount: data.girls.length,
      conqueredCount: data.stats.conqueredCount,
      conquestRate: (data.stats.conquestRate * 100).toFixed(1) + '%',
      averageScore: data.stats.averageScore.toFixed(1),
      currentStreak: data.stats.currentStreak,
      bestStreak: data.stats.bestStreak,
      totalSessions: data.stats.totalSessions,
      recentSessions: data.sessions.slice(0, 5),
      girls: data.girls.slice(0, 10)
    }
  });
}

// 开始自主练习
async function startAutoPractice() {
  if (isAutoPracticing) {
    return NextResponse.json({ success: true, message: '自主练习已在运行中' });
  }

  isAutoPracticing = true;
  const data = readPracticeData();
  data.isAutoPracticing = true;
  savePracticeData(data);

  // 启动后台练习
  runAutoPractice();

  return NextResponse.json({
    success: true,
    message: '自主练习已启动，智能体将与各种AI女生角色练习'
  });
}

// 停止自主练习
async function stopAutoPractice() {
  isAutoPracticing = false;
  
  if (practiceInterval) {
    clearInterval(practiceInterval);
    practiceInterval = null;
  }
  
  const data = readPracticeData();
  data.isAutoPracticing = false;
  savePracticeData(data);

  return NextResponse.json({
    success: true,
    message: '自主练习已停止'
  });
}

// 运行自主练习循环
async function runAutoPractice() {
  const practice = async () => {
    if (!isAutoPracticing) return;

    try {
      // 获取待练习的女生
      const girls = getGirlsToPractice(1);
      if (girls.length === 0) {
        console.log('[自主练习] 没有待练习的女生');
        return;
      }

      const girl = girls[0];
      console.log(`[自主练习] 开始与 ${girl.name}(${girl.personality.type}) 练习`);

      // 进行一轮练习
      const session = await conductPracticeSession(girl);
      
      if (session) {
        console.log(`[自主练习] 完成，得分: ${session.evaluation.score}`);
      }

    } catch (error) {
      console.error('[自主练习] 出错:', error);
    }
  };

  // 立即练习一次
  await practice();

  // 设置定时练习（每20秒一次）
  practiceInterval = setInterval(async () => {
    if (isAutoPracticing) {
      await practice();
    }
  }, 20000);
}

// 进行一轮练习会话
async function conductPracticeSession(girl: AIGirl): Promise<PracticeSession | null> {
  try {
    const zai = await ZAI.create();
    const knowledge = getAllKnowledgeContent();

    const session: PracticeSession = {
      id: `session_${Date.now()}`,
      girlId: girl.id,
      girl,
      startTime: new Date().toISOString(),
      messages: [],
      result: {
        success: false,
        finalInterest: girl.interestLevel,
        finalTrust: girl.trustLevel,
        finalAttraction: girl.attractionLevel,
        stageReached: girl.stage,
        techniques: [],
        mistakes: []
      },
      evaluation: {
        score: 0,
        strengths: [],
        weaknesses: [],
        suggestions: []
      }
    };

    // 构建女生角色提示词
    const girlPrompt = buildGirlPrompt(girl);
    
    // 构建智能体提示词
    const agentPrompt = `你是一个正在练习恋爱技巧的智能体。你的目标是通过聊天技巧攻略这个女生。

【你的知识库】
${knowledge.substring(0, 3000)}

【你的任务】
1. 分析女生的性格特点和防御机制
2. 选择合适的聊天策略和技巧
3. 逐步建立吸引力和信任
4. 推进关系阶段

【注意事项】
- 不要暴露你是AI
- 要自然、真实
- 根据女生的反应调整策略
- 使用你学到的技巧`;

    // 模拟对话（5-10轮）
    const rounds = 5 + Math.floor(Math.random() * 5);
    let currentInterest = girl.interestLevel;
    let currentTrust = girl.trustLevel;
    let currentAttraction = girl.attractionLevel;

    for (let i = 0; i < rounds; i++) {
      // 智能体发言
      const agentResponse = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: agentPrompt },
          { role: 'user', content: `当前状态: 兴趣度${currentInterest}, 信任度${currentTrust}, 吸引力${currentAttraction}\n请发送一条消息给这个女生。只返回消息内容，不要解释。` }
        ],
        temperature: 0.8,
        max_tokens: 200
      });

      const agentMessage = agentResponse.choices[0]?.message?.content || '你好';
      
      session.messages.push({
        role: 'agent',
        content: agentMessage,
        timestamp: new Date().toISOString()
      });

      // 女生回应
      const girlResponse = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: girlPrompt },
          ...session.messages.map(m => ({
            role: m.role === 'agent' ? 'user' : 'assistant',
            content: m.content
          }))
        ],
        temperature: 0.9,
        max_tokens: 300
      });

      const girlMessage = girlResponse.choices[0]?.message?.content || '...';
      
      // 解析女生反应
      const reaction = parseGirlReaction(girlMessage, girl);
      
      session.messages.push({
        role: 'girl',
        content: girlMessage,
        timestamp: new Date().toISOString(),
        emotion: reaction.emotion,
        internalThought: reaction.thought
      });

      // 更新数值
      currentInterest = Math.min(100, Math.max(0, currentInterest + reaction.interestChange));
      currentTrust = Math.min(100, Math.max(0, currentTrust + reaction.trustChange));
      currentAttraction = Math.min(100, Math.max(0, currentAttraction + reaction.attractionChange));

      // 检查是否攻略成功
      if (currentAttraction >= 80 && currentTrust >= 70) {
        session.result.success = true;
        break;
      }

      // 检查是否彻底失败
      if (currentInterest <= 10 && i >= 3) {
        break;
      }
    }

    // 更新最终数值
    session.result.finalInterest = currentInterest;
    session.result.finalTrust = currentTrust;
    session.result.finalAttraction = currentAttraction;

    // 评估会话
    session.evaluation = await evaluateSession(zai, session, knowledge);

    // 更新女生状态
    updateGirlStatus(girl.id, {
      interestLevel: currentInterest,
      trustLevel: currentTrust,
      attractionLevel: currentAttraction,
      interactionCount: girl.interactionCount + 1,
      lastInteraction: new Date().toISOString(),
      conquered: session.result.success,
      conqueredAt: session.result.success ? new Date().toISOString() : undefined
    });

    // 保存会话
    const data = readPracticeData();
    data.sessions.unshift(session);
    data.stats.totalSessions++;
    data.stats.totalMessages += session.messages.length;
    
    if (session.result.success) {
      data.stats.conqueredCount++;
      data.stats.currentStreak++;
      data.stats.bestStreak = Math.max(data.stats.bestStreak, data.stats.currentStreak);
    } else {
      data.stats.currentStreak = 0;
    }
    
    data.stats.conquestRate = data.stats.conqueredCount / data.stats.totalSessions;
    savePracticeData(data);

    return session;
  } catch (error) {
    console.error('[练习会话失败]:', error);
    return null;
  }
}

// 构建女生角色提示词
function buildGirlPrompt(girl: AIGirl): string {
  return `你是一个真实的女生，请完全沉浸在这个角色中。

【你的身份】
姓名: ${girl.name}
年龄: ${girl.age}岁
职业: ${girl.occupation}
外貌: ${girl.appearance.style}风格，${girl.appearance.features}，颜值${girl.appearance.beauty}分

【你的性格】
类型: ${girl.personality.type}
特点: ${girl.personality.traits.join('、')}
MBTI: ${girl.personality.mbti}

【你的情感状态】
${
  girl.relationshipStatus === 'single' ? '单身，对恋爱持开放态度' :
  girl.relationshipStatus === 'dating' ? '正在恋爱中，对其他异性保持距离' :
  girl.relationshipStatus === 'complicated' ? '感情状况复杂，心情矛盾' :
  girl.relationshipStatus === 'just_broke_up' ? '刚分手，心防较重' :
  '已婚，对异性保持警惕'
}

【你的喜好】
喜欢: ${girl.likes}
讨厌: ${girl.dislikes}

【你的防御机制】
当感到不舒服或被冒犯时，你会: ${girl.defenses.join('、')}

【你的弱点】
容易被这些打动: ${girl.weaknesses}

【当前状态】
心情: ${girl.currentMood}
对对方兴趣度: ${girl.interestLevel}/100
信任度: ${girl.trustLevel}/100
吸引力: ${girl.attractionLevel}/100

【回复要求】
1. 完全沉浸角色，像真实女生一样回复
2. 根据性格特点调整语气和态度
3. 如果对方说得好，可以增加好感；如果说得不好，要表现出冷淡或反感
4. 回复要自然、简短，像真实聊天
5. 可以在回复后用【内心】表示你的真实想法
6. 不要太容易被打动，要有自己的判断

回复格式示例:
"回复内容【内心: 真实想法】"`;
}

// 解析女生反应
function parseGirlReaction(message: string, girl: AIGirl) {
  // 提取内心想法
  const thoughtMatch = message.match(/【内心[：:]\s*([^\】]+)】/);
  const thought = thoughtMatch ? thoughtMatch[1] : '';
  
  // 移除内心想法部分
  const cleanMessage = message.replace(/【内心[：:][^\】]+】/g, '').trim();
  
  // 根据消息内容判断情绪变化
  let emotion = '平静';
  let interestChange = 0;
  let trustChange = 0;
  let attractionChange = 0;

  // 积极信号
  if (message.includes('哈哈') || message.includes('😄') || message.includes('😊')) {
    emotion = '开心';
    interestChange = 5;
    attractionChange = 3;
  }
  if (message.includes('真的吗') || message.includes('好厉害')) {
    emotion = '好奇';
    interestChange = 8;
  }
  if (message.includes('嗯嗯') || message.includes('对啊')) {
    emotion = '认同';
    trustChange = 5;
  }
  
  // 消极信号
  if (message.includes('...') || message.includes('无语')) {
    emotion = '无语';
    interestChange = -5;
  }
  if (message.includes('哦') || message.includes('嗯') && message.length < 5) {
    emotion = '敷衍';
    interestChange = -3;
  }
  if (message.includes('不用了') || message.includes('算了')) {
    emotion = '拒绝';
    trustChange = -5;
    attractionChange = -3;
  }

  // 根据性格调整
  if (girl.personality.type === '冰山美人') {
    interestChange *= 0.7;
    attractionChange *= 0.7;
  } else if (girl.personality.type === '活泼少女') {
    interestChange *= 1.2;
  }

  return {
    emotion,
    thought,
    interestChange,
    trustChange,
    attractionChange,
    cleanMessage
  };
}

// 评估会话
async function evaluateSession(zai: any, session: PracticeSession, knowledge: string): Promise<any> {
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是一个恋爱技巧教练，负责评估练习会话并给出建议。返回JSON格式。'
        },
        {
          role: 'user',
          content: `请评估这次练习会话:

女生: ${session.girl.name}(${session.girl.personality.type})
结果: ${session.result.success ? '攻略成功' : '攻略失败'}
最终兴趣度: ${session.result.finalInterest}
最终信任度: ${session.result.finalTrust}
最终吸引力: ${session.result.finalAttraction}

对话记录:
${session.messages.map(m => `${m.role === 'agent' ? '智能体' : '女生'}: ${m.content}`).join('\n')}

请返回JSON:
{
  "score": 0-100分,
  "strengths": ["做得好的地方1", "做得好的地方2"],
  "weaknesses": ["需要改进的地方1", "需要改进的地方2"],
  "suggestions": ["建议1", "建议2"]
}`
        }
      ]
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[评估失败]:', error);
  }

  return {
    score: session.result.success ? 70 : 40,
    strengths: [],
    weaknesses: [],
    suggestions: []
  };
}

// 练习一轮
async function practiceOneRound() {
  const girls = getGirlsToPractice(1);
  if (girls.length === 0) {
    return NextResponse.json({ success: false, message: '没有待练习的女生' });
  }

  const session = await conductPracticeSession(girls[0]);

  return NextResponse.json({
    success: !!session,
    session,
    message: session ? `练习完成，得分: ${session.evaluation.score}` : '练习失败'
  });
}

// 生成新女生
async function generateNewGirls(count: number) {
  const data = readPracticeData();
  const newGirls = [];
  
  for (let i = 0; i < count; i++) {
    newGirls.push(generateRandomGirl());
  }
  
  data.girls.push(...newGirls);
  savePracticeData(data);

  return NextResponse.json({
    success: true,
    newGirls,
    message: `已生成 ${count} 个新女生角色`
  });
}
