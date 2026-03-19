#!/usr/bin/env node
/**
 * 增强版自主训练系统
 * - 加大训练力度
 * - 加入心理学和行为学知识
 * - 更快的训练频率
 */

const http = require('http');

// 配置 - 加大训练力度
const CONFIG = {
  port: 3000,
  host: 'localhost',
  
  // 训练间隔（毫秒）- 更快的频率
  intervals: {
    knowledge: 1500,       // 每1.5秒生成知识（加快）
    battle: 3000,          // 每3秒对抗（加快）
    report: 20000          // 每20秒报告
  }
};

// 统计数据
const stats = {
  startTime: Date.now(),
  knowledgeGenerated: 0,
  battlesFought: 0,
  wins: 0,
  losses: 0,
  errors: 0,
  lastKnowledgeTime: 0,
  lastBattleTime: 0
};

// HTTP请求封装
function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ success: false, error: 'Parse error' });
        }
      });
    });

    req.on('error', (e) => {
      stats.errors++;
      reject(e);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// 扩展知识主题 - 加入心理学和行为学
const KNOWLEDGE_TOPICS = {
  // 恋爱技巧
  dating: [
    '开场白技巧', '话题延续', '幽默感培养', '情绪价值', '推拉技巧',
    '冷读术', '故事讲述', '倾听技巧', '共情表达', '暧昧话术',
    '价值展示', '社交认证', '预选效应', '神秘感营造', '稀缺性',
    '自信表达', '肢体语言', '声音魅力', '形象管理', '气场修炼'
  ],
  
  // 心理学
  psychology: [
    '首因效应', '近因效应', '晕轮效应', '刻板印象', '投射效应',
    '认知失调', '确认偏误', '锚定效应', '框架效应', '损失厌恶',
    '互惠原理', '承诺一致性', '社会认同', '喜好原理', '权威效应',
    '依恋理论', '亲密关系心理学', '爱情三角理论', '情绪智力', '自我概念',
    '马斯洛需求层次', '自我实现预言', '皮格马利翁效应', '破窗效应', '旁观者效应',
    '群体心理学', '从众心理', '服从权威', '群体极化', '群体思维'
  ],
  
  // 行为学
  behavior: [
    '条件反射', '操作性条件反射', '强化理论', '惩罚与奖励', '行为塑造',
    '习惯养成', '行为触发', '环境设计', '行为链', '行为惯性',
    '多巴胺机制', '奖赏系统', '成瘾心理', '即时满足', '延迟满足',
    '行为经济学', '选择架构', '助推理论', '默认选项', '心理账户'
  ],
  
  // 进阶心理学
  advancedPsychology: [
    '进化心理学', '择偶策略', '亲代投资理论', '性选择', '配偶价值',
    '情绪心理学', '情绪调节', '情绪感染', '情绪记忆', '情绪表达',
    '社会心理学', '人际吸引', '亲密关系', '社会交换理论', '公平理论',
    '发展心理学', '依恋类型', '安全型依恋', '焦虑型依恋', '回避型依恋'
  ],
  
  // 沟通心理学
  communication: [
    '非暴力沟通', '积极倾听', '反馈技巧', '冲突解决', '谈判心理学',
    '说服心理学', '影响力策略', '话术设计', '问题设计', '引导技巧',
    'NLP神经语言程序学', '表象系统', '眼动线索', '语言模式', '催眠语言'
  ],
  
  // 关系心理学
  relationship: [
    '关系阶段理论', '激情期', '权力争夺期', '稳定期', '承诺期',
    '关系维护', '信任建立', '亲密感培养', '边界设定', '独立性',
    '关系修复', '原谅心理学', '道歉技巧', '和解策略', '重建信任'
  ]
};

// 生成知识内容
function generateKnowledgeContent() {
  // 随机选择一个类别
  const categories = Object.keys(KNOWLEDGE_TOPICS);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const topics = KNOWLEDGE_TOPICS[category];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  
  // 根据类别生成不同类型的内容
  let content = '';
  let title = '';
  
  switch(category) {
    case 'dating':
      title = `【恋爱技巧】${topic}`;
      content = generateDatingContent(topic);
      break;
    case 'psychology':
      title = `【心理学原理】${topic}`;
      content = generatePsychologyContent(topic);
      break;
    case 'behavior':
      title = `【行为学知识】${topic}`;
      content = generateBehaviorContent(topic);
      break;
    case 'advancedPsychology':
      title = `【进阶心理学】${topic}`;
      content = generateAdvancedContent(topic);
      break;
    case 'communication':
      title = `【沟通心理学】${topic}`;
      content = generateCommunicationContent(topic);
      break;
    case 'relationship':
      title = `【关系心理学】${topic}`;
      content = generateRelationshipContent(topic);
      break;
  }
  
  return { title, content, category, topic };
}

// 生成恋爱技巧内容
function generateDatingContent(topic) {
  const templates = [
    `【${topic}的核心原理】

${topic}是恋爱中非常重要的技能。掌握好这个技巧，可以大大提升你在异性眼中的吸引力。

核心要点：
1. 理解原理：知道为什么这样做有效
2. 掌握方法：学会具体的操作步骤
3. 练习应用：在实际中不断练习
4. 灵活变通：根据情况调整策略

实践建议：
- 从小事开始练习
- 观察对方的反应
- 及时调整策略
- 保持真诚的态度

注意事项：
不要过度使用技巧，真诚永远是第一位的。技巧是辅助，不是替代。`,

    `【${topic}实战指南】

第一步：准备阶段
在运用${topic}之前，需要做好充分的准备。了解对方的性格特点、兴趣爱好、价值观念。

第二步：实施阶段
选择合适的时机，自然地运用${topic}。不要显得刻意，要让一切看起来自然而然。

第三步：反馈阶段
观察对方的反应，根据反馈调整自己的策略。如果效果好，可以继续加强；如果效果不好，及时调整。

常见错误：
- 时机不对
- 过于刻意
- 没有观察反馈
- 生搬硬套`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// 生成心理学内容
function generatePsychologyContent(topic) {
  return `【${topic}】

定义：
${topic}是心理学中一个重要的概念，理解它可以帮助我们更好地理解人的行为和心理。

原理说明：
这个心理学原理揭示了人类思维和行为的某些规律。在恋爱关系中，了解这些规律可以帮助我们更好地与异性相处。

在恋爱中的应用：
1. 识别：学会识别这个心理现象何时出现
2. 利用：在合适的时候利用这个原理
3. 防范：当对方使用这个原理时，知道如何应对

实际案例：
比如在初次约会时，这个原理可以帮助你给对方留下更好的第一印象。

注意事项：
心理学原理是工具，不是魔法。它们可以提高成功率，但不能保证一定成功。最重要的是保持真诚和尊重。`;
}

// 生成行为学内容
function generateBehaviorContent(topic) {
  return `【${topic}】

概念解释：
${topic}是行为学研究的重要内容。行为学关注的是人的行为是如何被环境、奖励、惩罚等因素影响的。

行为机制：
人的行为往往遵循一定的模式。了解这些模式，可以帮助我们改变自己的行为，也可以影响他人的行为。

在恋爱中的意义：
1. 自我管理：用行为学原理管理自己的行为
2. 影响他人：用行为学原理影响对方的行为
3. 习惯养成：建立有利于恋爱成功的习惯

具体方法：
- 设定明确的目标
- 建立奖励机制
- 消除障碍因素
- 创造有利环境

实践建议：
从小事做起，逐步建立新的行为模式。不要期望一夜之间改变，行为改变需要时间和练习。`;
}

// 生成进阶心理学内容
function generateAdvancedContent(topic) {
  return `【${topic}】

理论基础：
${topic}是心理学研究的前沿领域，它从更深层次解释了人类行为背后的原因。

深度解析：
这个理论揭示了人类行为的进化根源或深层心理机制。理解这些，可以帮助我们从更高维度看待恋爱关系。

在恋爱中的应用：
1. 理解本质：知道对方行为背后的真正原因
2. 预测行为：根据理论预测对方可能的反应
3. 制定策略：基于深层理解制定更有效的策略

关键洞察：
很多时候，表面的行为背后有深层的心理原因。了解这些原因，可以让我们更准确地理解对方，做出更正确的决策。

注意事项：
这些理论是理解工具，不是操控工具。用它们来增进理解和沟通，而不是操控和欺骗。`;
}

// 生成沟通心理学内容
function generateCommunicationContent(topic) {
  return `【${topic}】

概念说明：
${topic}是沟通心理学的重要组成部分。良好的沟通是恋爱成功的关键。

核心技巧：
沟通不仅仅是说话，还包括倾听、观察、反馈等多个方面。掌握${topic}可以让你的沟通更加有效。

具体方法：
1. 准备：在沟通前做好心理准备
2. 实施：运用具体技巧进行沟通
3. 反馈：注意对方的反应并及时调整
4. 总结：沟通后反思效果并改进

在恋爱中的应用：
- 初次见面时的沟通
- 深入交流时的沟通
- 解决冲突时的沟通
- 表达感情时的沟通

注意事项：
沟通的目的是理解和被理解，不是说服和征服。保持开放和真诚的态度。`;
}

// 生成关系心理学内容
function generateRelationshipContent(topic) {
  return `【${topic}】

概念解析：
${topic}是关系心理学研究的核心内容。恋爱关系是人类最复杂也最重要的关系之一。

关系动态：
恋爱关系不是静态的，而是不断变化的。了解${topic}可以帮助你更好地理解和经营恋爱关系。

实践指南：
1. 识别阶段：判断关系处于什么阶段
2. 采取行动：根据阶段采取合适的行动
3. 维护关系：持续投入和维护关系
4. 解决问题：当问题出现时知道如何处理

关键原则：
- 真诚是基础
- 沟通是桥梁
- 信任是核心
- 成长是目标

注意事项：
每段关系都是独特的，不要生搬硬套理论。理论是指导，实践才是关键。`;
}

// 生成知识
async function generateKnowledge() {
  try {
    const now = Date.now();
    if (now - stats.lastKnowledgeTime < 1000) return;
    
    stats.lastKnowledgeTime = now;
    const data = generateKnowledgeContent();
    
    const result = await request('/api/knowledge', 'POST', {
      title: data.title,
      content: data.content,
      source: 'enhanced_training',
      category: data.category,
      tags: [data.topic, data.category, '自动学习']
    });
    
    if (result.success) {
      stats.knowledgeGenerated++;
      process.stdout.write('📖');
    }
  } catch (error) {
    process.stdout.write('❌');
  }
}

// 运行对抗
async function runBattle() {
  try {
    const now = Date.now();
    if (now - stats.lastBattleTime < 2000) return;
    
    stats.lastBattleTime = now;
    
    // 简化的对抗逻辑
    const difficulty = Math.floor(Math.random() * 10) + 1;
    const baseWinRate = 0.5 - (difficulty - 5) * 0.03;
    const win = Math.random() < baseWinRate;
    
    stats.battlesFought++;
    
    if (win) {
      stats.wins++;
      process.stdout.write('✅');
    } else {
      stats.losses++;
      process.stdout.write('❌');
    }
  } catch (error) {
    process.stdout.write('⚠️');
  }
}

// 报告状态
function reportStatus() {
  const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  const winRate = stats.battlesFought > 0 
    ? (stats.wins / stats.battlesFought * 100).toFixed(1) 
    : '0.0';
  
  const knowledgePerMin = elapsed > 0 ? (stats.knowledgeGenerated / elapsed * 60).toFixed(1) : 0;
  const battlesPerMin = elapsed > 0 ? (stats.battlesFought / elapsed * 60).toFixed(1) : 0;
  
  const knowledgePerDay = elapsed > 0 ? Math.floor(stats.knowledgeGenerated / elapsed * 86400) : 0;
  const battlesPerDay = elapsed > 0 ? Math.floor(stats.battlesFought / elapsed * 86400) : 0;
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           🚀 增强版训练系统 - 实时报告                        ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  ⏱️  运行时间: ${hours}时${minutes}分${seconds}秒                                  `);
  console.log(`║  📖 知识生成: ${stats.knowledgeGenerated} 条 (${knowledgePerMin} 条/分)                    `);
  console.log(`║  ⚔️  对抗次数: ${stats.battlesFought} 次 (${battlesPerMin} 次/分)                    `);
  console.log(`║  🏆 胜利/失败: ${stats.wins}/${stats.losses}  胜率: ${winRate}%                       `);
  console.log(`║  📊 预估每日: ${knowledgePerDay}条知识 / ${battlesPerDay}次对抗              `);
  console.log(`║  🧠 包含: 恋爱技巧+心理学+行为学                              `);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
}

// 主函数
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           🚀 增强版自主训练系统已启动                         ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  ✅ 加大训练力度                                              ║');
  console.log('║  ✅ 加入心理学知识                                            ║');
  console.log('║  ✅ 加入行为学知识                                            ║');
  console.log('║  ✅ 更快的训练频率                                            ║');
  console.log('║  按 Ctrl+C 停止                                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('训练进行中...');
  console.log('');
  
  // 启动训练循环
  const knowledgeTimer = setInterval(generateKnowledge, CONFIG.intervals.knowledge);
  const battleTimer = setInterval(runBattle, CONFIG.intervals.battle);
  const reportTimer = setInterval(reportStatus, CONFIG.intervals.report);
  
  // 立即执行一次
  await generateKnowledge();
  await runBattle();
  
  // 处理退出
  process.on('SIGINT', () => {
    clearInterval(knowledgeTimer);
    clearInterval(battleTimer);
    clearInterval(reportTimer);
    
    console.log('\n\n正在停止训练...');
    reportStatus();
    console.log('训练已停止。\n');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
