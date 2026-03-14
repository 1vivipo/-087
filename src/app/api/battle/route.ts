import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeContent } from '@/lib/knowledge-store';
import {
  readSirenSystem,
  saveSirenSystem,
  generateGirlRoster,
  GirlCharacter,
  BattleRecord,
  EvaluationResult,
  GOAL_CONFIGS,
  GoalType
} from '@/lib/siren-system';
import ZAI from 'z-ai-web-dev-sdk';

// 全局状态
let isRunning = false;
let battleInterval: NodeJS.Timeout | null = null;

// 启动对抗系统
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, goal } = body;

    if (action === 'start') {
      return await startBattleSystem();
    } else if (action === 'stop') {
      return await stopBattleSystem();
    } else if (action === 'battle') {
      return await conductBattle(goal);
    } else if (action === 'generate_girls') {
      return await generateGirls();
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    console.error('[对抗系统] 错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取状态
export async function GET() {
  const data = readSirenSystem();
  
  const difficultyStats = {
    easy: data.girls.filter(g => g.difficulty <= 3).length,
    medium: data.girls.filter(g => g.difficulty >= 4 && g.difficulty <= 6).length,
    hard: data.girls.filter(g => g.difficulty >= 7 && g.difficulty <= 9).length,
    siren: data.girls.filter(g => g.sirenAvatar).length
  };
  
  return NextResponse.json({
    success: true,
    status: {
      isRunning,
      sirenAI: {
        name: data.sirenAI.name,
        level: data.sirenAI.level,
        winRate: (data.sirenAI.record.winRate * 100).toFixed(1) + '%',
        isLearning: data.sirenAI.isLearning
      },
      girls: {
        total: data.girls.length,
        conquered: data.girls.filter(g => g.conquered).length,
        difficultyStats
      },
      stats: data.stats,
      recentBattles: data.battles.slice(0, 5),
      topGirls: data.girls
        .filter(g => !g.conquered)
        .sort((a, b) => b.difficulty - a.difficulty)
        .slice(0, 10)
    }
  });
}

// 启动对抗系统
async function startBattleSystem() {
  if (isRunning) {
    return NextResponse.json({ success: true, message: '对抗系统已在运行' });
  }

  isRunning = true;
  const data = readSirenSystem();
  data.isRunning = true;
  saveSirenSystem(data);

  runBattleLoop();

  return NextResponse.json({
    success: true,
    message: '对抗系统已启动！智能体将与女生角色进行恋爱博弈练习'
  });
}

// 停止对抗系统
async function stopBattleSystem() {
  isRunning = false;
  
  if (battleInterval) {
    clearInterval(battleInterval);
    battleInterval = null;
  }
  
  const data = readSirenSystem();
  data.isRunning = false;
  saveSirenSystem(data);

  return NextResponse.json({
    success: true,
    message: '对抗系统已停止'
  });
}

// 运行对抗循环
async function runBattleLoop() {
  const battle = async () => {
    if (!isRunning) return;

    try {
      const data = readSirenSystem();
      
      const availableGirls = data.girls.filter(g => !g.conquered);
      if (availableGirls.length === 0) {
        console.log('[对抗系统] 所有女生已攻略！');
        return;
      }

      const girl = availableGirls.sort((a, b) => b.difficulty - a.difficulty)[0];
      const goal = girl.suitableGoals[Math.floor(Math.random() * girl.suitableGoals.length)];
      
      console.log(`[对抗系统] 开始攻略 ${girl.name}(${girl.personality.type}) 难度${girl.difficulty}`);
      
      const result = await conductBattleWithGirl(girl, goal);

    } catch (error) {
      console.error('[对抗系统] 出错:', error);
    }
  };

  await battle();

  battleInterval = setInterval(async () => {
    if (isRunning) {
      await battle();
    }
  }, 20000);
}

// 进行战斗
async function conductBattle(goal?: GoalType) {
  const data = readSirenSystem();
  const availableGirls = data.girls.filter(g => !g.conquered);
  
  if (availableGirls.length === 0) {
    return NextResponse.json({ success: false, message: '所有女生已攻略！' });
  }

  const girl = availableGirls[Math.floor(Math.random() * availableGirls.length)];
  const selectedGoal = goal || girl.suitableGoals[0];
  
  const result = await conductBattleWithGirl(girl, selectedGoal);
  
  return NextResponse.json({
    success: true,
    battle: result,
    message: result.success ? `成功攻略 ${girl.name}！` : `攻略 ${girl.name} 失败`
  });
}

// 与女生进行真实的恋爱博弈
async function conductBattleWithGirl(girl: GirlCharacter, goal: GoalType): Promise<any> {
  const zai = await ZAI.create();
  const knowledge = getAllKnowledgeContent();
  const goalConfig = GOAL_CONFIGS[goal];
  
  const battle: BattleRecord = {
    id: `battle_${Date.now()}`,
    timestamp: new Date().toISOString(),
    opponentType: girl.sirenAvatar ? 'siren' : 'agent',
    rounds: 0,
    messages: [],
    winner: 'draw',
    metrics: {
      attraction: [girl.state.attraction],
      trust: [girl.state.trust],
      value: [girl.state.value],
      intimacy: [girl.state.intimacy]
    },
    evaluation: {
      agentScore: 0,
      sirenScore: 0,
      analysis: ''
    }
  };

  // 构建真实的女生角色提示词
  const girlPrompt = buildRealisticGirlPrompt(girl, goal);
  
  // 构建基于恋爱学的智能体提示词
  const agentPrompt = buildRealisticAgentPrompt(knowledge, goal, girl);

  // 模拟真实聊天对话（6-10轮）
  const rounds = 6 + Math.floor(Math.random() * 5);
  let currentState = { ...girl.state };
  
  for (let i = 0; i < rounds; i++) {
    battle.rounds++;
    
    // 智能体发言 - 基于真实聊天技巧
    const agentResponse = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: agentPrompt },
        { role: 'user', content: `当前情况：
- 她的兴趣度: ${currentState.interest}/100
- 她的信任度: ${currentState.trust}/100  
- 她对你的吸引力: ${currentState.attraction}/100
- 亲密度: ${currentState.intimacy}/100

请发送一条自然的聊天消息。要求：
1. 像真实男生聊天一样自然
2. 使用你学到的恋爱技巧
3. 不要太长，像微信聊天一样简洁
4. 只返回消息内容，不要解释` }
      ],
      temperature: 0.9,
      max_tokens: 150
    });

    const agentMessage = agentResponse.choices[0]?.message?.content || '你好';
    battle.messages.push({ role: 'agent', content: agentMessage });

    // 女生回应 - 真实的女生反应
    const girlResponse = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: girlPrompt },
        ...battle.messages.slice(-6).map(m => ({
          role: m.role === 'agent' ? 'user' : 'assistant',
          content: m.content
        }))
      ],
      temperature: 0.9,
      max_tokens: 200
    });

    const girlMessage = girlResponse.choices[0]?.message?.content || '...';
    
    // 解析女生的真实反应
    const reaction = parseRealisticReaction(girlMessage, girl);
    battle.messages.push({ 
      role: 'girl', 
      content: girlMessage.replace(/【[^】]+】/g, '').trim(),
      emotion: reaction.emotion,
      internalThought: reaction.thought
    });

    // 更新状态 - 基于真实的社交动态
    currentState.interest = Math.min(100, Math.max(0, currentState.interest + reaction.interestChange));
    currentState.trust = Math.min(100, Math.max(0, currentState.trust + reaction.trustChange));
    currentState.attraction = Math.min(100, Math.max(0, currentState.attraction + reaction.attractionChange));
    currentState.intimacy = Math.min(100, Math.max(0, currentState.intimacy + reaction.intimacyChange));

    battle.metrics.attraction.push(currentState.attraction);
    battle.metrics.trust.push(currentState.trust);
    battle.metrics.value.push(currentState.value);
    battle.metrics.intimacy.push(currentState.intimacy);

    // 检查成功条件
    if (checkSuccess(currentState, goalConfig)) {
      battle.winner = 'agent';
      break;
    }

    // 检查失败条件
    if (currentState.interest <= 5 || (i >= 4 && currentState.attraction <= 10)) {
      battle.winner = 'siren';
      break;
    }
  }

  // 评估战斗
  battle.evaluation = await evaluateBattle(zai, battle, girl, goal);

  // 更新数据
  const data = readSirenSystem();
  const girlIndex = data.girls.findIndex(g => g.id === girl.id);
  
  if (girlIndex !== -1) {
    data.girls[girlIndex].state = currentState;
    data.girls[girlIndex].interactions++;
    
    if (battle.winner === 'agent') {
      data.girls[girlIndex].conquered = true;
      data.girls[girlIndex].conqueredAt = new Date().toISOString();
      data.girls[girlIndex].conqueredForGoal = goal;
      data.stats.conqueredGirls++;
      data.stats.currentStreak++;
      data.stats.bestStreak = Math.max(data.stats.bestStreak, data.stats.currentStreak);
    } else if (battle.winner === 'siren') {
      data.stats.currentStreak = 0;
    }
  }
  
  data.battles.unshift(battle);
  data.stats.totalBattles++;
  if (battle.winner === 'agent') data.stats.battlesWon++;
  if (battle.winner === 'siren') data.stats.battlesLost++;
  
  data.stats.goalStats[goal].attempted++;
  if (battle.winner === 'agent') data.stats.goalStats[goal].succeeded++;
  
  saveSirenSystem(data);

  return {
    success: battle.winner === 'agent',
    girl: girl.name,
    goal,
    rounds: battle.rounds,
    finalState: currentState,
    score: battle.evaluation.agentScore,
    winner: battle.winner
  };
}

// 构建真实的女生提示词
function buildRealisticGirlPrompt(girl: GirlCharacter, goal: GoalType): string {
  const basePrompt = `你是一个真实的女生，请完全沉浸在这个角色中，像真人一样聊天。

【你的基本信息】
姓名: ${girl.name}
年龄: ${girl.age}岁
职业: ${girl.identity.occupation}

【你的性格】
类型: ${girl.personality.type}
特点: ${girl.personality.traits.join('、')}

【你现在的状态】
感情状态: ${girl.emotional.status === 'single' ? '单身' : girl.emotional.status === 'dating' ? '有男朋友' : '感情状况复杂'}
心情: ${girl.state.mood}

【你的反应方式】
根据你的性格，你会这样反应：
- 如果对方说话有趣或让你开心，你会积极回应
- 如果对方无聊或让你不舒服，你会敷衍或冷淡
- 如果对方说得好，你的好感度会上升
- 如果对方说错话，你的好感度会下降

【回复要求】
1. 像真实女生在微信上聊天一样回复
2. 回复要简短自然，不要太长
3. 可以用表情，但要符合你的性格
4. 根据对方说的话决定你的态度
5. 在回复后用【内心】简单描述你的真实想法，比如【内心: 这人还挺有趣的】`;

  // 根据性格类型添加特点
  const personalityAddons: Record<string, string> = {
    '冰山美人': `
【你的特点】
- 你比较高冷，不会轻易对陌生人热情
- 你需要对方展示出真正的价值才会感兴趣
- 简短的回复是你的常态，除非对方真的打动了你`,
    
    '傲娇公主': `
【你的特点】
- 你嘴上会说不，但心里可能不是这样想
- 你喜欢对方主动，但不会轻易承认
- 你会用反话来测试对方`,
    
    '活泼少女': `
【你的特点】
- 你性格开朗，容易聊天
- 你喜欢有趣的话题和幽默的人
- 你会主动延续话题`,
    
    '高冷总裁': `
【你的特点】
- 你很独立，不需要依附别人
- 你欣赏有能力、有见识的人
- 你对平庸的追求者没有耐心`,
    
    '温柔姐姐': `
【你的特点】
- 你很包容，会照顾对方的感受
- 你喜欢成熟稳重的人
- 你会给予积极的回应`,
    
    '小公主': `
【你的特点】
- 你喜欢被宠爱和关注
- 你会有些小任性，但很可爱
- 你需要对方哄你、宠你`
  };

  const addon = personalityAddons[girl.personality.type] || '';
  
  // 海王级别的特殊设定
  const sirenAddon = girl.sirenAvatar ? `
【海王特质】
你很擅长处理感情：
- 你不会轻易被攻略
- 你懂得如何保持距离和神秘感
- 你会测试对方的真心
- 你不会轻易承诺或答应什么` : '';

  return basePrompt + addon + sirenAddon;
}

// 构建基于恋爱学的智能体提示词
function buildRealisticAgentPrompt(knowledge: string, goal: GoalType, girl: GirlCharacter): string {
  const goalTips: Record<GoalType, string> = {
    quick_score: '目标是快速推进关系。使用：制造性张力、肢体进挪暗示、时间压缩等技巧。',
    tame: '目标是让她对你言听计从。使用：框架控制、奖惩机制、服从性测试等技巧。',
    conquer: '目标是让她爱上你。使用：建立吸引力、提供情绪价值、展示高价值等技巧。',
    love: '目标是建立恋爱关系。使用：真诚沟通、建立信任、共同话题等技巧。',
    marry: '目标是走向婚姻。使用：展示责任感、谈未来规划、家庭观念等技巧。',
    money: '目标是获取经济利益。使用：价值展示、需求引导等技巧。',
    friendzone: '目标是保持朋友关系。使用：边界设定、友谊框架等技巧。',
    fwb: '目标是保持纯肉体关系。使用：性张力、边界设定等技巧。',
    sugar_baby: '目标是建立干亲关系。使用：资源展示、保护欲引导等技巧。',
    worship: '目标是让她崇拜你。使用：价值碾压、成就展示、神秘感等技巧。'
  };

  return `你是一个正在练习恋爱技巧的男生。你要像真人一样自然地聊天。

【你的知识库】
${knowledge.substring(0, 3000)}

【当前目标】
${goalTips[goal]}

【目标女生】
- 姓名: ${girl.name}
- 性格: ${girl.personality.type}
- 难度: ${girl.difficulty}/10
${girl.sirenAvatar ? '- 注意：她很擅长处理感情，不容易被攻略' : ''}

【聊天原则】
1. 像正常男生聊天一样自然，不要像机器人
2. 根据她的性格选择合适的聊天方式
3. 使用你学到的技巧，但要自然地融入对话
4. 不要一次性展示太多，保持神秘感
5. 关注她的反应，适时调整策略

【技巧提示】
- 开场要自然，可以用情境开场或冷读开场
- 聊天中可以使用推拉技巧，制造情绪起伏
- 适当展示自己的价值，但不要炫耀
- 可以用幽默化解尴尬，但不要油腻
- 注意节奏，不要一直发消息`;
}

// 解析真实的女生反应
function parseRealisticReaction(message: string, girl: GirlCharacter) {
  // 提取内心想法
  const thoughtMatch = message.match(/【内心[：:]\s*([^\】]+)】/);
  const thought = thoughtMatch ? thoughtMatch[1] : '';
  
  // 根据消息内容判断情绪和态度变化
  let emotion = '平静';
  let interestChange = 0;
  let trustChange = 0;
  let attractionChange = 0;
  let intimacyChange = 0;

  const cleanMessage = message.replace(/【[^】]+】/g, '').trim();
  
  // 积极信号
  if (cleanMessage.includes('哈哈') || cleanMessage.includes('😄') || cleanMessage.includes('😊') || cleanMessage.includes('笑死')) {
    emotion = '开心';
    interestChange = 5 + Math.floor(Math.random() * 5);
    attractionChange = 3 + Math.floor(Math.random() * 3);
  }
  
  if (cleanMessage.includes('真的吗') || cleanMessage.includes('好厉害') || cleanMessage.includes('这么厉害')) {
    emotion = '好奇';
    interestChange = 8 + Math.floor(Math.random() * 5);
  }
  
  if (cleanMessage.includes('嗯嗯') || cleanMessage.includes('对啊') || cleanMessage.includes('确实')) {
    emotion = '认同';
    trustChange = 3 + Math.floor(Math.random() * 3);
  }
  
  if (cleanMessage.includes('我也') || cleanMessage.includes('一样')) {
    emotion = '共鸣';
    trustChange = 5 + Math.floor(Math.random() * 3);
    attractionChange = 3 + Math.floor(Math.random() * 3);
  }
  
  // 消极信号
  if (cleanMessage === '...' || cleanMessage === '哦' || cleanMessage === '嗯' || cleanMessage === '好') {
    emotion = '敷衍';
    interestChange = -3 - Math.floor(Math.random() * 3);
  }
  
  if (cleanMessage.includes('无语') || cleanMessage.includes('...')) {
    emotion = '无语';
    interestChange = -5 - Math.floor(Math.random() * 5);
    attractionChange = -3 - Math.floor(Math.random() * 3);
  }
  
  if (cleanMessage.includes('不用了') || cleanMessage.includes('算了') || cleanMessage.includes('没必要')) {
    emotion = '拒绝';
    trustChange = -5;
    attractionChange = -5;
  }
  
  // 根据性格调整反应强度
  if (girl.personality.type === '冰山美人' || girl.personality.type === '高冷总裁') {
    // 高冷型反应更保守
    if (interestChange > 0) interestChange = Math.floor(interestChange * 0.6);
    if (attractionChange > 0) attractionChange = Math.floor(attractionChange * 0.6);
  } else if (girl.personality.type === '活泼少女' || girl.personality.type === '邻家女孩') {
    // 开放型反应更积极
    if (interestChange > 0) interestChange = Math.floor(interestChange * 1.3);
  }
  
  // 海王级别更难攻略
  if (girl.sirenAvatar) {
    if (interestChange > 0) interestChange = Math.floor(interestChange * 0.4);
    if (attractionChange > 0) attractionChange = Math.floor(attractionChange * 0.4);
    if (trustChange > 0) trustChange = Math.floor(trustChange * 0.5);
  }

  return {
    emotion,
    thought,
    interestChange,
    trustChange,
    attractionChange,
    intimacyChange
  };
}

// 检查成功
function checkSuccess(state: any, config: any): boolean {
  return state.interest >= config.successConditions.minInterest &&
         state.trust >= config.successConditions.minTrust &&
         state.attraction >= config.successConditions.minAttraction &&
         state.intimacy >= config.successConditions.minIntimacy;
}

// 评估战斗
async function evaluateBattle(zai: any, battle: BattleRecord, girl: GirlCharacter, goal: GoalType) {
  try {
    const completion = await zai.chat.completions.create({
      messages: [{
        role: 'user',
        content: `请评估这次恋爱博弈练习：

女生: ${girl.name}(${girl.personality.type}) 难度${girl.difficulty}
目标: ${goal}
结果: ${battle.winner === 'agent' ? '成功' : battle.winner === 'siren' ? '失败' : '平局'}
回合数: ${battle.rounds}

最终状态:
- 兴趣度: ${battle.metrics.attraction[battle.metrics.attraction.length - 1]}
- 信任度: ${battle.metrics.trust[battle.metrics.trust.length - 1]}  
- 亲密度: ${battle.metrics.intimacy[battle.metrics.intimacy.length - 1]}

对话记录:
${battle.messages.map(m => `${m.role === 'agent' ? '男生' : '女生'}: ${m.content}`).join('\n')}

请从恋爱技巧角度评估，返回JSON:
{
  "agentScore": 0-100分,
  "sirenScore": 0-100分,
  "analysis": "从聊天技巧、情绪价值、吸引力建立等角度分析"
}`
      }],
      temperature: 0.5
    });

    const jsonMatch = completion.choices[0]?.message?.content?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('[评估失败]:', error);
  }

  return {
    agentScore: battle.winner === 'agent' ? 70 : 40,
    sirenScore: battle.winner === 'siren' ? 70 : 40,
    analysis: ''
  };
}

// 生成女生
async function generateGirls() {
  const data = readSirenSystem();
  const newGirls = generateGirlRoster();
  data.girls = newGirls;
  data.stats.totalGirls = newGirls.length;
  saveSirenSystem(data);

  return NextResponse.json({
    success: true,
    count: newGirls.length,
    message: `已生成 ${newGirls.length} 个女生角色`
  });
}
