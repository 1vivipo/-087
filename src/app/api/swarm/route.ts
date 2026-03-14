import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeContent, addKnowledgeItem } from '@/lib/knowledge-store';
import {
  readSwarmSystem,
  saveSwarmSystem,
  updateAgentStatus,
  updateSirenStatus,
  AgentAI,
  SirenAI
} from '@/lib/swarm-system';
import ZAI from 'z-ai-web-dev-sdk';

// 全局状态
let isRunning = false;
let swarmInterval: NodeJS.Timeout | null = null;

// 启动群体系统
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      return await startSwarmSystem();
    } else if (action === 'stop') {
      return await stopSwarmSystem();
    } else if (action === 'discuss') {
      return await startDiscussion(body);
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    console.error('[群体系统] 错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取状态
export async function GET() {
  const data = readSwarmSystem();
  
  const agentStats = {
    totalLevel: data.agentTeam.members.reduce((sum, a) => sum + a.progress.level, 0),
    avgSuccessRate: data.agentTeam.members.reduce((sum, a) => sum + a.progress.successRate, 0) / 10,
    totalBattles: data.agentTeam.members.reduce((sum, a) => sum + a.record.battles, 0),
    totalWins: data.agentTeam.members.reduce((sum, a) => sum + a.record.wins, 0)
  };
  
  const sirenStats = {
    totalLevel: data.sirenTeam.members.reduce((sum, s) => sum + s.progress.level, 0),
    avgDefenseRate: data.sirenTeam.members.reduce((sum, s) => sum + s.progress.defenseRate, 0) / 10,
    totalDefenses: data.sirenTeam.members.reduce((sum, s) => sum + s.record.defenses, 0),
    totalSuccesses: data.sirenTeam.members.reduce((sum, s) => sum + s.record.successes, 0)
  };
  
  return NextResponse.json({
    success: true,
    status: {
      isRunning,
      agentTeam: {
        members: data.agentTeam.members,
        stats: agentStats,
        teamLevel: data.agentTeam.teamLevel
      },
      sirenTeam: {
        members: data.sirenTeam.members,
        stats: sirenStats,
        teamLevel: data.sirenTeam.teamLevel
      },
      discussions: {
        total: data.discussions.length,
        active: data.discussions.filter(d => d.result === 'ongoing').length,
        recent: data.discussions.slice(0, 5)
      },
      wisdom: {
        successCases: data.wisdom.successCases.length,
        failureLessons: data.wisdom.failureLessons.length,
        techniques: data.wisdom.techniques.length,
        counterTechniques: data.wisdom.counterTechniques.length
      },
      stats: data.stats
    }
  });
}

// 启动群体系统
async function startSwarmSystem() {
  if (isRunning) {
    return NextResponse.json({ success: true, message: '群体系统已在运行' });
  }

  isRunning = true;
  const data = readSwarmSystem();
  data.isRunning = true;
  saveSwarmSystem(data);

  runSwarmLoop();

  return NextResponse.json({
    success: true,
    message: '群体系统已启动！20个AI角色将同时学习恋爱技巧'
  });
}

// 停止群体系统
async function stopSwarmSystem() {
  isRunning = false;
  
  if (swarmInterval) {
    clearInterval(swarmInterval);
    swarmInterval = null;
  }
  
  const data = readSwarmSystem();
  data.isRunning = false;
  saveSwarmSystem(data);

  return NextResponse.json({
    success: true,
    message: '群体系统已停止'
  });
}

// 运行群体循环
async function runSwarmLoop() {
  const loop = async () => {
    if (!isRunning) return;

    try {
      const data = readSwarmSystem();
      
      const agentIndex = Math.floor(Math.random() * data.agentTeam.members.length);
      const agent = data.agentTeam.members[agentIndex];
      
      const sirenIndex = Math.floor(Math.random() * data.sirenTeam.members.length);
      const siren = data.sirenTeam.members[sirenIndex];
      
      const action = Math.random();
      
      if (action < 0.35) {
        await agentLearn(agent);
      } else if (action < 0.55) {
        await sirenLearn(siren);
      } else if (action < 0.85) {
        await agentVsSiren(agent, siren);
      } else {
        if (agent.record.losses > 0) {
          await initiateDiscussion(agent);
        }
      }

    } catch (error) {
      console.error('[群体循环] 出错:', error);
    }
  };

  await loop();

  swarmInterval = setInterval(async () => {
    if (isRunning) {
      await loop();
    }
  }, 12000);
}

// AI学习恋爱技巧
async function agentLearn(agent: AgentAI) {
  try {
    const zai = await ZAI.create();
    
    const topics = agent.learningFocus.topics;
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    console.log(`[学习] ${agent.name} 正在学习: ${topic}`);
    
    updateAgentStatus(agent.id, {
      status: 'learning',
      currentActivity: `学习: ${topic}`
    });
    
    const completion = await zai.chat.completions.create({
      messages: [{
        role: 'user',
        content: `你是${agent.name}，一个正在学习恋爱技巧的男生。
你的专长方向是: ${agent.specialty.primary}
你的风格是: ${agent.specialty.style}

请学习主题"${topic}"，整理成实用的知识笔记。

要求：
1. 内容要实用、可操作
2. 包含具体的聊天话术示例
3. 说明在什么情况下使用
4. 注意事项和常见错误

返回JSON格式:
{
  "title": "标题",
  "content": "详细内容（包含理论、技巧、话术示例）",
  "keyPoints": ["要点1", "要点2"],
  "scenarios": ["适用场景1", "适用场景2"],
  "examples": ["话术示例1", "话术示例2"],
  "warnings": ["注意事项1", "注意事项2"]
}`
      }],
      temperature: 0.7
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const learned = JSON.parse(jsonMatch[0]);
      
      addKnowledgeItem({
        title: `[${agent.name}] ${learned.title}`,
        content: learned.content,
        source: 'web',
        category: agent.specialty.primary,
        tags: [topic, agent.name],
        summary: learned.keyPoints?.join('；'),
        keyPoints: learned.keyPoints
      });
      
      const data = readSwarmSystem();
      const agentData = data.agentTeam.members.find(a => a.id === agent.id);
      if (agentData) {
        agentData.progress.totalLearned++;
        agentData.progress.experience += 10;
        if (agentData.progress.experience >= agentData.progress.level * 100) {
          agentData.progress.level++;
        }
        agentData.status = 'resting';
        agentData.currentActivity = '待命';
        saveSwarmSystem(data);
      }
    }

  } catch (error) {
    console.error(`[学习失败] ${agent.name}:`, error);
  }
}

// 海王学习反制技巧
async function sirenLearn(siren: SirenAI) {
  try {
    const zai = await ZAI.create();
    
    const topics = ['如何识别追求技巧', '如何保持距离感', '如何测试真心', '如何不被套路'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    console.log(`[海王学习] ${siren.name} 正在学习: ${topic}`);
    
    updateSirenStatus(siren.id, {
      status: 'learning',
      currentActivity: `学习: ${topic}`
    });
    
    const completion = await zai.chat.completions.create({
      messages: [{
        role: 'user',
        content: `你是一个经验丰富的女生，正在学习如何识别和应对各种追求技巧。

请学习主题"${topic}"，整理成实用的反制方法。

要求：
1. 内容要真实、接地气
2. 说明如何识别对方的套路
3. 如何自然地应对
4. 保持自己的价值和边界

返回JSON格式:
{
  "title": "标题",
  "content": "详细内容",
  "howToIdentify": ["识别方法1", "识别方法2"],
  "howToRespond": ["应对方法1", "应对方法2"],
  "warnings": ["注意事项"]
}`
      }],
      temperature: 0.7
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const data = readSwarmSystem();
      const sirenData = data.sirenTeam.members.find(s => s.id === siren.id);
      if (sirenData) {
        sirenData.progress.totalLearned++;
        sirenData.progress.experience += 10;
        if (sirenData.progress.experience >= sirenData.progress.level * 100) {
          sirenData.progress.level++;
        }
        sirenData.status = 'resting';
        sirenData.currentActivity = '待命';
        saveSwarmSystem(data);
      }
    }

  } catch (error) {
    console.error(`[海王学习失败] ${siren.name}:`, error);
  }
}

// AI vs 海王对抗 - 真实的恋爱博弈
async function agentVsSiren(agent: AgentAI, siren: SirenAI) {
  try {
    const zai = await ZAI.create();
    const knowledge = getAllKnowledgeContent();
    
    console.log(`[对抗] ${agent.name} vs ${siren.name}`);
    
    updateAgentStatus(agent.id, { status: 'practicing', currentActivity: `练习: ${siren.name}` });
    updateSirenStatus(siren.id, { status: 'defending', currentActivity: `应对: ${agent.name}` });
    
    // 模拟真实的聊天对话
    const rounds = 4 + Math.floor(Math.random() * 4);
    let agentScore = 50;
    let sirenScore = 50;
    const conversation: string[] = [];
    
    for (let i = 0; i < rounds; i++) {
      // 男生发消息
      const agentCompletion = await zai.chat.completions.create({
        messages: [{
          role: 'user',
          content: `你是一个男生，正在和一个女生聊天。
你的风格是: ${agent.specialty.style}
你擅长的技巧: ${agent.specialty.primary}

${conversation.length > 0 ? `之前的对话:\n${conversation.join('\n')}\n` : ''}

请发送一条自然的聊天消息。要求：
1. 像真人聊天一样自然
2. 使用你的聊天技巧
3. 简短，像微信聊天
4. 只返回消息内容`
        }],
        temperature: 0.9,
        max_tokens: 100
      });
      
      const agentMessage = agentCompletion.choices[0]?.message?.content || '你好';
      conversation.push(`男生: ${agentMessage}`);
      
      // 女生回应
      const sirenCompletion = await zai.chat.completions.create({
        messages: [{
          role: 'user',
          content: `你是一个女生，正在和一个男生聊天。
你的性格特点: ${siren.specialty.style}
你擅长: ${siren.specialty.primary}

之前的对话:
${conversation.join('\n')}

请自然地回应。要求：
1. 像真实女生聊天一样
2. 根据对方说的话决定你的态度
3. 简短自然
4. 只返回消息内容`
        }],
        temperature: 0.9,
        max_tokens: 100
      });
      
      const sirenMessage = sirenCompletion.choices[0]?.message?.content || '嗯';
      conversation.push(`女生: ${sirenMessage}`);
      
      // 评估这轮对话
      const evalCompletion = await zai.chat.completions.create({
        messages: [{
          role: 'user',
          content: `评估这段对话:

男生: ${agentMessage}
女生: ${sirenMessage}

从恋爱技巧角度评估:
1. 男生的聊天技巧如何？(1-10分)
2. 女生的态度如何？(积极/中性/消极)
3. 男生的表现让女生好感上升还是下降？

返回JSON: {"agentScore": 1-10, "sirenAttitude": "积极/中性/消极", "direction": "上升/下降/不变"}`
        }],
        temperature: 0.5
      });
      
      const evalText = evalCompletion.choices[0]?.message?.content || '';
      const evalMatch = evalText.match(/\{[\s\S]*\}/);
      
      if (evalMatch) {
        const evaluation = JSON.parse(evalMatch[0]);
        
        if (evaluation.direction === '上升') {
          agentScore += 5 + Math.floor(Math.random() * 5);
          sirenScore -= 3;
        } else if (evaluation.direction === '下降') {
          agentScore -= 5;
          sirenScore += 3 + Math.floor(Math.random() * 3);
        }
        
        agentScore = Math.max(0, Math.min(100, agentScore));
        sirenScore = Math.max(0, Math.min(100, sirenScore));
      }
    }
    
    // 判定胜负
    const agentWins = agentScore > sirenScore;
    
    // 更新战绩
    const data = readSwarmSystem();
    
    const agentData = data.agentTeam.members.find(a => a.id === agent.id);
    if (agentData) {
      agentData.record.battles++;
      if (agentWins) {
        agentData.record.wins++;
        agentData.progress.experience += 30;
      } else {
        agentData.record.losses++;
        agentData.progress.experience += 10;
      }
      agentData.progress.totalPracticed++;
      agentData.progress.successRate = agentData.record.wins / agentData.record.battles;
      agentData.status = 'resting';
      agentData.currentActivity = '待命';
    }
    
    const sirenData = data.sirenTeam.members.find(s => s.id === siren.id);
    if (sirenData) {
      sirenData.record.defenses++;
      if (!agentWins) {
        sirenData.record.successes++;
        sirenData.progress.experience += 30;
      } else {
        sirenData.record.failures++;
        sirenData.progress.experience += 10;
      }
      sirenData.progress.totalDefended++;
      sirenData.progress.defenseRate = sirenData.record.successes / sirenData.record.defenses;
      sirenData.status = 'resting';
      sirenData.currentActivity = '待命';
    }
    
    data.stats.totalBattles++;
    if (agentWins) {
      data.stats.agentWins++;
    } else {
      data.stats.sirenWins++;
    }
    
    saveSwarmSystem(data);
    
    console.log(`[对抗结果] ${agent.name} ${agentWins ? '胜利' : '失败'} (${agentScore} vs ${sirenScore})`);

  } catch (error) {
    console.error(`[对抗失败]:`, error);
  }
}

// 发起讨论 - 基于真实恋爱问题
async function initiateDiscussion(agent: AgentAI) {
  try {
    const zai = await ZAI.create();
    
    console.log(`[讨论] ${agent.name} 发起讨论`);
    
    updateAgentStatus(agent.id, { status: 'discussing', currentActivity: '发起讨论' });
    
    // 真实的恋爱问题场景
    const realScenarios = [
      '我在微信上认识了一个女生，聊了几天，但她回复越来越慢，有时候一天才回一条，我该怎么办？',
      '我喜欢一个女生，但她好像只把我当朋友，怎么突破朋友区？',
      '第一次约会，不知道去哪里，怕选的地方她不喜欢，怎么选约会地点？',
      '女生说"你是个好人"，我知道这是被发好人卡了，还能挽回吗？',
      '和女生聊天总是不知道说什么，经常冷场，怎么才能让聊天有趣？',
      '女生忽冷忽热的，有时候很热情，有时候又不理我，这是什么意思？',
      '我想表白，但不知道时机对不对，什么时候表白最合适？',
      '女生问我"你谈过几次恋爱"，这个问题怎么回答才好？',
      '约会的时候想牵手，但不知道怎么自然地牵，怕被拒绝尴尬',
      '女生说她有男朋友了，但我感觉她对我也有意思，我该继续追吗？'
    ];
    
    const randomScenario = realScenarios[Math.floor(Math.random() * realScenarios.length)];
    
    const completion = await zai.chat.completions.create({
      messages: [{
        role: 'user',
        content: `你是一个普通男生，正在学习如何追女生、如何和女生相处。

你遇到了这个关于追女生的问题：
"${randomScenario}"

请描述你的困惑，向朋友们求助。

示例（请模仿这个风格）：
{
  "topic": "聊天冷场怎么办",
  "situation": "我在微信上认识了一个女生，刚开始聊得还行，但最近不知道说什么了，经常聊着聊着就没话题了，她回复也越来越慢，我该怎么办？",
  "failedAttempts": ["试着找话题，但感觉她不感兴趣", "问她在干嘛，她只回几个字"],
  "stuckPoint": "不知道怎么让聊天变得有趣，让她愿意主动找我聊"
}

请返回JSON，记住这是关于追女生的真实问题：
{
  "topic": "讨论主题",
  "situation": "具体情况（真实的追女生场景）",
  "failedAttempts": ["尝试过的方法"],
  "stuckPoint": "卡住的地方"
}`
      }],
      temperature: 0.7
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const problem = JSON.parse(jsonMatch[0]);
      
      const discussion = {
        id: `disc_${Date.now()}`,
        timestamp: new Date().toISOString(),
        initiator: {
          type: 'agent' as const,
          id: agent.id,
          name: agent.name
        },
        topic: problem.topic,
        problem: {
          targetId: '',
          targetName: '女生',
          targetType: '高难度',
          difficulty: 8,
          situation: problem.situation,
          failedAttempts: problem.failedAttempts,
          stuckPoint: problem.stuckPoint
        },
        replies: [],
        result: 'ongoing' as const
      };
      
      const data = readSwarmSystem();
      data.discussions.unshift(discussion as any);
      data.stats.discussionsStarted++;
      saveSwarmSystem(data);
      
      // 让其他AI回复
      await generateTeamReplies(discussion as any);
    }

  } catch (error) {
    console.error(`[讨论失败]:`, error);
  }
}

// 生成团队回复 - 基于真实恋爱建议
async function generateTeamReplies(discussion: any) {
  const zai = await ZAI.create();
  const data = readSwarmSystem();
  
  const otherAgents = data.agentTeam.members
    .filter(a => a.id !== discussion.initiator.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  for (const agent of otherAgents) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [{
          role: 'user',
          content: `你是${agent.name}，一个正在学习恋爱技巧的男生。
你的专长是: ${agent.specialty.primary}

${discussion.initiator.name}遇到了这个问题:
主题: ${discussion.topic}
情况: ${discussion.problem.situation}
尝试过: ${discussion.problem.failedAttempts.join('、')}
卡住点: ${discussion.problem.stuckPoint}

请给出你的建议。要求：
1. 建议要具体、可操作，是真实的聊天技巧
2. 可以举例说明具体该怎么说，比如具体的聊天话术
3. 结合你的专长给出建议
4. 不要有任何科幻或奇怪的内容

返回JSON:
{
  "content": "回复内容（真实的建议）",
  "suggestedStrategy": {
    "name": "策略名称",
    "description": "策略描述",
    "steps": ["具体步骤1", "具体步骤2"]
  }
}`
        }],
        temperature: 0.8
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const reply = JSON.parse(jsonMatch[0]);
        
        const discussionReply = {
          id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          responder: {
            type: 'agent',
            id: agent.id,
            name: agent.name,
            specialty: agent.specialty.primary
          },
          content: reply.content,
          suggestedStrategy: reply.suggestedStrategy,
          ratings: [],
          averageRating: 0
        };
        
        const data = readSwarmSystem();
        const disc = data.discussions.find(d => d.id === discussion.id);
        if (disc) {
          disc.replies.push(discussionReply as any);
          saveSwarmSystem(data);
        }
      }
      
    } catch (error) {
      console.error(`[回复失败] ${agent.name}:`, error);
    }
  }
}

// 开始讨论
async function startDiscussion(body: any) {
  const { agentId } = body;
  const data = readSwarmSystem();
  const agent = data.agentTeam.members.find(a => a.id === agentId);
  
  if (!agent) {
    return NextResponse.json({ success: false, error: 'AI不存在' }, { status: 404 });
  }
  
  await initiateDiscussion(agent);
  
  return NextResponse.json({
    success: true,
    message: `${agent.name}已发起讨论`
  });
}
