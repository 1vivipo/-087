import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import {
  readTrainingData,
  saveTrainingData,
  updateTodayStats,
  addDecision,
  addTask,
  updateTaskStatus,
  getNextTask
} from '@/lib/autonomous-training';
import { getAllKnowledgeContent, addKnowledgeItem } from '@/lib/knowledge-store';
import { readSwarmSystem, saveSwarmSystem } from '@/lib/swarm-system';
import { readSirenSystem, saveSirenSystem } from '@/lib/siren-system';

// 全局状态
let isRunning = false;
let trainingIntervals: NodeJS.Timeout[] = [];

// 启动自主训练系统
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      return await startAutonomousTraining();
    } else if (action === 'stop') {
      return await stopAutonomousTraining();
    } else if (action === 'generate_knowledge') {
      return await generateKnowledgeBatch(body.count || 100);
    } else if (action === 'mass_battle') {
      return await runMassBattles(body.count || 1000);
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    console.error('[自主训练] 错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 获取状态
export async function GET() {
  const data = readTrainingData();
  const knowledge = getAllKnowledgeContent();
  const swarm = readSwarmSystem();
  const siren = readSirenSystem();
  
  // 计算实时统计
  const totalKnowledge = knowledge.length;
  const totalBattles = siren.stats?.totalBattles || 0;
  const totalWins = siren.stats?.battlesWon || 0;
  const girlsConquered = siren.girls?.filter((g: any) => g.conquered).length || 0;
  
  return NextResponse.json({
    success: true,
    status: {
      isRunning,
      currentPhase: data.currentPhase,
      
      // 今日统计
      today: data.stats.today,
      
      // 总体统计
      total: {
        knowledgeBase: totalKnowledge,
        totalBattles,
        totalWins,
        totalLosses: totalBattles - totalWins,
        girlsConquered,
        averageSuccessRate: totalBattles > 0 ? (totalWins / totalBattles * 100).toFixed(1) + '%' : '0%'
      },
      
      // 监督智能体
      supervisors: data.supervisors.map(s => ({
        name: s.name,
        role: s.role,
        currentTask: s.currentTask,
        decisions: s.stats.decisions,
        accuracy: s.stats.decisions > 0 ? (s.stats.correctDecisions / s.stats.decisions * 100).toFixed(0) + '%' : '0%'
      })),
      
      // 最近决策
      recentDecisions: data.decisions.slice(0, 5),
      
      // 训练配置
      config: {
        dailyTargets: data.config.dailyTargets,
        parallelism: data.config.parallelism
      },
      
      // 成长指标
      growth: data.stats.growth,
      
      // 队列状态
      queues: {
        learning: data.learningQueue.length,
        battle: data.battleQueue.length,
        tasks: data.tasks.filter(t => t.status === 'pending').length
      }
    }
  });
}

// 启动自主训练
async function startAutonomousTraining() {
  if (isRunning) {
    return NextResponse.json({ success: true, message: '自主训练已在运行' });
  }

  isRunning = true;
  const data = readTrainingData();
  data.isRunning = true;
  data.currentPhase = '大规模训练中';
  saveTrainingData(data);

  // 启动多个并行训练循环
  startKnowledgeGeneration();      // 知识生成循环
  startMassBattleTraining();       // 大规模对抗训练
  startDiscussionTraining();       // 讨论训练
  startSupervisionLoop();          // 监督循环
  startEvolutionLoop();            // 进化循环

  return NextResponse.json({
    success: true,
    message: '自主训练系统已启动！目标：每日千万级训练量'
  });
}

// 停止自主训练
async function stopAutonomousTraining() {
  isRunning = false;
  
  trainingIntervals.forEach(interval => clearInterval(interval));
  trainingIntervals = [];
  
  const data = readTrainingData();
  data.isRunning = false;
  data.currentPhase = '已停止';
  saveTrainingData(data);

  return NextResponse.json({
    success: true,
    message: '自主训练已停止'
  });
}

// ==================== 知识生成循环 ====================

function startKnowledgeGeneration() {
  // 每2秒生成一批知识
  const interval = setInterval(async () => {
    if (!isRunning) return;
    
    try {
      await generateKnowledgeBatch(50);  // 每批50条
    } catch (error) {
      console.error('[知识生成] 错误:', error);
    }
  }, 2000);
  
  trainingIntervals.push(interval);
}

// 批量生成知识
async function generateKnowledgeBatch(count: number) {
  const zai = await ZAI.create();
  
  // 知识主题池
  const topics = [
    // 聊天技巧
    '开场白技巧', '话题延续', '幽默感培养', '情绪价值提供', '推拉技巧',
    '冷读术', '故事讲述', '倾听技巧', '共情表达', '暧昧话术',
    
    // 吸引力建立
    '价值展示', '社交认证', '预选效应', '神秘感营造', '稀缺性原理',
    '自信表达', '肢体语言', '声音魅力', '形象管理', '气场修炼',
    
    // 心理技巧
    '心理分析', '依恋类型', '人格类型', '情绪操控', '认知失调',
    '框架控制', '服从性测试', '奖惩机制', '价值打压', '情感投资',
    
    // 约会技巧
    '约会地点选择', '约会流程设计', '肢体进挪', '氛围营造', '时间压缩',
    '约会话题', '约会礼仪', '约会收尾', '后续跟进', '关系升级',
    
    // 长期关系
    '信任建立', '舒适感营造', '共同成长', '冲突处理', '边界设定',
    '长期吸引力', '情感维护', '生活融合', '未来规划', '承诺管理',
    
    // 特殊场景
    '挽回技巧', '断联复联', '二次吸引', '好人卡应对', '废物测试应对',
    '高难度攻略', '海王反制', '异地恋', '年龄差', '职场恋情'
  ];
  
  let generated = 0;
  
  for (let i = 0; i < Math.min(count, 10); i++) {
    try {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      const completion = await zai.chat.completions.create({
        messages: [{
          role: 'user',
          content: `你是恋爱技巧知识库的自动生成系统。请生成关于"${topic}"的详细知识。

要求：
1. 内容要实用、可操作
2. 包含具体的技巧说明
3. 包含实际应用场景
4. 包含注意事项

返回JSON格式:
{
  "title": "标题",
  "content": "详细内容（300-500字）",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "scenarios": ["适用场景1", "适用场景2"],
  "examples": ["示例1", "示例2"],
  "warnings": ["注意事项"]
}`
        }],
        temperature: 0.8
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const knowledge = JSON.parse(jsonMatch[0]);
        
        addKnowledgeItem({
          title: knowledge.title,
          content: knowledge.content,
          source: 'auto_generated',
          category: topic.split('·')[0],
          tags: [topic],
          summary: knowledge.keyPoints?.join('；'),
          keyPoints: knowledge.keyPoints
        });
        
        generated++;
      }
    } catch (error) {
      // 继续下一个
    }
  }
  
  // 更新统计
  const data = readTrainingData();
  data.stats.today.knowledgeLearned += generated;
  saveTrainingData(data);
  
  return NextResponse.json({
    success: true,
    generated,
    message: `已生成 ${generated} 条知识`
  });
}

// ==================== 大规模对抗训练 ====================

function startMassBattleTraining() {
  // 每1秒运行一批对抗
  const interval = setInterval(async () => {
    if (!isRunning) return;
    
    try {
      await runMassBattles(100);  // 每批100次对抗
    } catch (error) {
      console.error('[对抗训练] 错误:', error);
    }
  }, 1000);
  
  trainingIntervals.push(interval);
}

// 大规模对抗
async function runMassBattles(count: number) {
  const zai = await ZAI.create();
  const knowledge = getAllKnowledgeContent();
  const sirenData = readSirenSystem();
  
  // 获取未攻略的女生
  const availableGirls = sirenData.girls.filter(g => !g.conquered);
  if (availableGirls.length === 0) {
    return NextResponse.json({ success: false, message: '所有女生已攻略' });
  }
  
  let battles = 0;
  let wins = 0;
  
  // 批量进行简化对抗（提高效率）
  for (let i = 0; i < Math.min(count, 20); i++) {
    try {
      const girl = availableGirls[Math.floor(Math.random() * availableGirls.length)];
      
      // 简化的对抗评估
      const completion = await zai.chat.completions.create({
        messages: [{
          role: 'user',
          content: `快速评估恋爱博弈结果：

女生类型: ${girl.personality.type}
难度: ${girl.difficulty}/10
当前状态: 兴趣${girl.state.interest} 信任${girl.state.trust} 吸引${girl.state.attraction}

基于以下知识进行评估:
${knowledge.substring(0, 1000)}

返回JSON: {
  "result": "win/lose",
  "score": 0-100,
  "keyFactor": "关键因素",
  "improvement": "改进建议"
}`
        }],
        temperature: 0.7,
        max_tokens: 150
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        battles++;
        
        if (result.result === 'win') {
          wins++;
          // 更新女生状态
          const girlIndex = sirenData.girls.findIndex(g => g.id === girl.id);
          if (girlIndex !== -1) {
            sirenData.girls[girlIndex].state.interest = Math.min(100, girl.state.interest + 10);
            sirenData.girls[girlIndex].state.attraction = Math.min(100, girl.state.attraction + 10);
            
            // 检查是否攻略成功
            if (sirenData.girls[girlIndex].state.interest >= 70 && 
                sirenData.girls[girlIndex].state.attraction >= 70) {
              sirenData.girls[girlIndex].conquered = true;
              sirenData.stats.conqueredGirls++;
            }
          }
        }
        
        sirenData.stats.totalBattles++;
        if (result.result === 'win') sirenData.stats.battlesWon++;
        else sirenData.stats.battlesLost++;
      }
    } catch (error) {
      // 继续
    }
  }
  
  saveSirenSystem(sirenData);
  
  // 更新今日统计
  const data = readTrainingData();
  data.stats.today.battlesFought += battles;
  data.stats.today.successRate = battles > 0 ? wins / battles : 0;
  saveTrainingData(data);
  
  return NextResponse.json({
    success: true,
    battles,
    wins,
    winRate: battles > 0 ? (wins / battles * 100).toFixed(1) + '%' : '0%'
  });
}

// ==================== 讨论训练 ====================

function startDiscussionTraining() {
  // 每5秒进行一批讨论
  const interval = setInterval(async () => {
    if (!isRunning) return;
    
    try {
      await runDiscussions(10);
    } catch (error) {
      console.error('[讨论训练] 错误:', error);
    }
  }, 5000);
  
  trainingIntervals.push(interval);
}

// 运行讨论
async function runDiscussions(count: number) {
  const zai = await ZAI.create();
  const swarmData = readSwarmSystem();
  
  const problems = [
    '如何突破女生的防御机制',
    '聊天冷场怎么破',
    '女生说"你是个好人"怎么应对',
    '如何判断女生的好感度',
    '约会时如何自然进挪',
    '如何处理女生的废物测试',
    '女生忽冷忽热怎么办',
    '如何建立长期吸引力',
    '表白时机如何把握',
    '如何应对高难度目标'
  ];
  
  let discussions = 0;
  
  for (let i = 0; i < Math.min(count, 5); i++) {
    try {
      const problem = problems[Math.floor(Math.random() * problems.length)];
      const agent = swarmData.agentTeam.members[Math.floor(Math.random() * swarmData.agentTeam.members.length)];
      
      const completion = await zai.chat.completions.create({
        messages: [{
          role: 'user',
          content: `你是${agent.name}，正在讨论恋爱技巧问题。

问题: ${problem}

请给出你的见解和建议。返回JSON:
{
  "insight": "你的见解",
  "suggestion": "具体建议",
  "example": "实际示例"
}`
        }],
        temperature: 0.8,
        max_tokens: 200
      });

      discussions++;
    } catch (error) {
      // 继续
    }
  }
  
  // 更新统计
  const data = readTrainingData();
  data.stats.today.discussionsHeld += discussions;
  saveTrainingData(data);
  
  saveSwarmSystem(swarmData);
}

// ==================== 监督循环 ====================

function startSupervisionLoop() {
  // 每10秒进行一次监督检查
  const interval = setInterval(async () => {
    if (!isRunning) return;
    
    try {
      await runSupervision();
    } catch (error) {
      console.error('[监督] 错误:', error);
    }
  }, 10000);
  
  trainingIntervals.push(interval);
}

// 运行监督
async function runSupervision() {
  const zai = await ZAI.create();
  const data = readTrainingData();
  const knowledge = getAllKnowledgeContent();
  
  // 计算当前表现
  const todayProgress = {
    knowledgeProgress: data.stats.today.knowledgeLearned / data.config.dailyTargets.knowledgeToLearn * 100,
    battleProgress: data.stats.today.battlesFought / data.config.dailyTargets.battlesToFight * 100,
    successRate: data.stats.today.successRate * 100
  };
  
  // 监督智能体分析
  const completion = await zai.chat.completions.create({
    messages: [{
      role: 'user',
      content: `你是训练总监，负责监督恋爱智能体的训练进度。

当前训练状态:
- 知识学习进度: ${todayProgress.knowledgeProgress.toFixed(1)}%
- 对抗训练进度: ${todayProgress.battleProgress.toFixed(1)}%
- 成功率: ${todayProgress.successRate.toFixed(1)}%
- 知识库总量: ${knowledge.length}条

请分析并给出决策建议。返回JSON:
{
  "analysis": "当前状态分析",
  "issues": ["问题1", "问题2"],
  "recommendations": ["建议1", "建议2"],
  "adjustments": {
    "learningSpeed": "increase/maintain/decrease",
    "battleDifficulty": "increase/maintain/decrease",
    "focusArea": "重点领域"
  }
}`
    }],
    temperature: 0.5
  });

  const responseText = completion.choices[0]?.message?.content || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const supervision = JSON.parse(jsonMatch[0]);
    
    // 记录决策
    addDecision({
      id: `decision_${Date.now()}`,
      timestamp: new Date().toISOString(),
      decisionMaker: '训练总监·天眼',
      decision: {
        type: 'adjust_strategy',
        reason: supervision.issues?.join('; ') || '',
        action: supervision.recommendations?.join('; ') || '',
        expectedOutcome: '提升训练效率'
      }
    });
    
    // 更新监督者统计
    const supervisor = data.supervisors.find(s => s.role === 'training_supervisor');
    if (supervisor) {
      supervisor.stats.decisions++;
      saveTrainingData(data);
    }
  }
}

// ==================== 进化循环 ====================

function startEvolutionLoop() {
  // 每30秒进行一次进化评估
  const interval = setInterval(async () => {
    if (!isRunning) return;
    
    try {
      await runEvolution();
    } catch (error) {
      console.error('[进化] 错误:', error);
    }
  }, 30000);
  
  trainingIntervals.push(interval);
}

// 运行进化
async function runEvolution() {
  const data = readTrainingData();
  const swarmData = readSwarmSystem();
  
  // 计算成长指标
  const knowledge = getAllKnowledgeContent();
  const prevKnowledge = data.stats.total.knowledgeBase || 0;
  const knowledgeGrowth = prevKnowledge > 0 ? (knowledge.length - prevKnowledge) / prevKnowledge : 0;
  
  // 更新成长指标
  data.stats.growth.knowledgeGrowthRate = knowledgeGrowth;
  data.stats.growth.levelProgress = swarmData.agentTeam.members.reduce((sum, a) => sum + a.progress.level, 0);
  
  // 更新总统计
  data.stats.total.knowledgeBase = knowledge.length;
  
  // 记录胜率趋势
  const sirenData = readSirenSystem();
  const winRate = sirenData.stats.totalBattles > 0 
    ? sirenData.stats.battlesWon / sirenData.stats.totalBattles 
    : 0;
  data.stats.growth.winRateTrend.push(winRate);
  if (data.stats.growth.winRateTrend.length > 100) {
    data.stats.growth.winRateTrend = data.stats.growth.winRateTrend.slice(-100);
  }
  
  saveTrainingData(data);
  
  // 自动调整训练策略
  if (winRate < 0.4) {
    // 胜率太低，降低难度
    data.config.qualityControl.minBattleRounds = Math.max(4, data.config.qualityControl.minBattleRounds - 1);
  } else if (winRate > 0.7) {
    // 胜率太高，提高难度
    data.config.qualityControl.minBattleRounds = Math.min(10, data.config.qualityControl.minBattleRounds + 1);
  }
  
  saveTrainingData(data);
}
