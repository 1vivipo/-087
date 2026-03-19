import { NextRequest, NextResponse } from 'next/server';
import { getAllKnowledgeContent } from '@/lib/knowledge-store';
import {
  readDocsIndex,
  getDocuments,
  readDocument,
  saveDocument,
  deleteDocument,
  getDocsStats,
  exportAsMarkdown,
  getToday,
  Document,
  DailySummary,
  MethodologyDoc,
  TechniqueGuide,
  DiscussionRecord,
  BattleRecord
} from '@/lib/document-system';
import { readSwarmSystem } from '@/lib/swarm-system';
import ZAI from 'z-ai-web-dev-sdk';

// 获取文档列表或生成文档
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'stats') {
    return NextResponse.json({ success: true, stats: getDocsStats() });
  }
  
  if (action === 'list') {
    const type = searchParams.get('type') as any;
    const authorId = searchParams.get('authorId') || undefined;
    const date = searchParams.get('date') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const docs = getDocuments({ type, authorId, date, limit });
    return NextResponse.json({ success: true, documents: docs });
  }
  
  if (action === 'detail') {
    const docId = searchParams.get('id');
    if (!docId) {
      return NextResponse.json({ success: false, error: '缺少文档ID' }, { status: 400 });
    }
    
    const doc = readDocument(docId);
    if (!doc) {
      return NextResponse.json({ success: false, error: '文档不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, document: doc });
  }
  
  if (action === 'download') {
    const docId = searchParams.get('id');
    if (!docId) {
      return NextResponse.json({ success: false, error: '缺少文档ID' }, { status: 400 });
    }
    
    const doc = readDocument(docId);
    if (!doc) {
      return NextResponse.json({ success: false, error: '文档不存在' }, { status: 404 });
    }
    
    const markdown = exportAsMarkdown(doc);
    
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${doc.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md"`
      }
    });
  }
  
  return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
}

// 生成文档
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'generate_daily_summary') {
      return await generateDailySummary(body.authorId);
    }
    
    if (action === 'generate_methodology') {
      return await generateMethodology(body.authorId);
    }
    
    if (action === 'generate_technique_guide') {
      return await generateTechniqueGuide(body.authorId, body.technique);
    }
    
    if (action === 'save_discussion') {
      return await saveDiscussionRecord(body.discussion);
    }
    
    if (action === 'save_battle') {
      return await saveBattleRecord(body.battle);
    }
    
    if (action === 'generate_all_summaries') {
      return await generateAllDailySummaries();
    }
    
    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    console.error('[文档生成] 错误:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 删除文档
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('id');
  
  if (!docId) {
    return NextResponse.json({ success: false, error: '缺少文档ID' }, { status: 400 });
  }
  
  const success = deleteDocument(docId);
  return NextResponse.json({ success });
}

// 生成每日总结
async function generateDailySummary(authorId: string) {
  const zai = await ZAI.create();
  const swarmData = readSwarmSystem();
  
  // 查找AI
  const agent = swarmData.agentTeam.members.find(a => a.id === authorId) ||
                swarmData.sirenTeam.members.find(s => s.id === authorId);
  
  if (!agent) {
    return NextResponse.json({ success: false, error: 'AI不存在' }, { status: 404 });
  }
  
  const isAgent = 'abilities' in agent && 'attraction' in agent.abilities;
  const today = getToday();
  
  // 生成总结
  const completion = await zai.chat.completions.create({
    messages: [{
      role: 'user',
      content: `你是${agent.name}，需要生成今日工作总结。

【你的身份】
- 名称: ${agent.name}
- 专长: ${isAgent ? (agent as any).specialty?.primary : (agent as any).specialty?.primary}
- 风格: ${isAgent ? (agent as any).specialty?.style : (agent as any).specialty?.style}

【今日数据】
- 学习次数: ${agent.progress?.totalLearned || 0}
- 练习次数: ${agent.progress?.totalPracticed || agent.progress?.totalDefended || 0}
- 胜利次数: ${agent.record?.wins || agent.record?.successes || 0}
- 失败次数: ${agent.record?.losses || agent.record?.failures || 0}
- 当前等级: ${agent.progress?.level || 1}
- 经验值: ${agent.progress?.experience || 0}

请生成详细的每日总结，返回JSON格式:
{
  "title": "标题",
  "summary": "简短摘要",
  "content": "详细总结内容（包含学习心得、实践感悟、技巧领悟等）",
  "achievements": ["成就1", "成就2"],
  "reflections": {
    "whatWentWell": ["做得好的1", "做得好的2"],
    "whatToImprove": ["需要改进的1", "需要改进的2"],
    "tomorrowPlan": ["明天计划1", "明天计划2"]
  },
  "keyInsights": ["关键洞察1", "关键洞察2"],
  "tags": ["标签1", "标签2"]
}`
    }],
    temperature: 0.7
  });

  const responseText = completion.choices[0]?.message?.content || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    return NextResponse.json({ success: false, error: '生成失败' }, { status: 500 });
  }
  
  const generated = JSON.parse(jsonMatch[0]);
  
  const doc: DailySummary = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'daily_summary',
    title: generated.title || `${agent.name}的每日总结 - ${today}`,
    author: {
      type: isAgent ? 'agent' : 'siren',
      id: agent.id,
      name: agent.name
    },
    createdAt: new Date().toISOString(),
    date: today,
    content: generated.content,
    summary: generated.summary,
    tags: generated.tags || [],
    dailyStats: {
      learningTime: 30,
      practiceCount: agent.progress?.totalPracticed || agent.progress?.totalDefended || 0,
      battleCount: agent.record?.battles || agent.record?.defenses || 0,
      winCount: agent.record?.wins || agent.record?.successes || 0,
      loseCount: agent.record?.losses || agent.record?.failures || 0,
      discussionCount: 0,
      newTechniquesLearned: agent.progress?.totalLearned || 0,
      experienceGained: agent.progress?.experience || 0
    },
    achievements: generated.achievements || [],
    reflections: generated.reflections || {
      whatWentWell: [],
      whatToImprove: [],
      tomorrowPlan: []
    },
    keyInsights: generated.keyInsights || []
  };
  
  const docId = saveDocument(doc);
  
  return NextResponse.json({
    success: true,
    documentId: docId,
    message: `${agent.name}的每日总结已生成`
  });
}

// 生成方法论文档
async function generateMethodology(authorId: string) {
  const zai = await ZAI.create();
  const swarmData = readSwarmSystem();
  const knowledge = getAllKnowledgeContent();
  
  const agent = swarmData.agentTeam.members.find(a => a.id === authorId) ||
                swarmData.sirenTeam.members.find(s => s.id === authorId);
  
  if (!agent) {
    return NextResponse.json({ success: false, error: 'AI不存在' }, { status: 404 });
  }
  
  const isAgent = 'abilities' in agent && 'attraction' in agent.abilities;
  const today = getToday();
  
  const completion = await zai.chat.completions.create({
    messages: [{
      role: 'user',
      content: `你是${agent.name}，需要整理你的方法论文档。

【你的身份】
- 名称: ${agent.name}
- 专长: ${isAgent ? (agent as any).specialty?.primary : (agent as any).specialty?.primary}
- 风格: ${isAgent ? (agent as any).specialty?.style : (agent as any).specialty?.style}
- 等级: ${agent.progress?.level || 1}

【知识库参考】
${knowledge.substring(0, 3000)}

请生成你的方法论文档，返回JSON格式:
{
  "title": "标题",
  "summary": "简短摘要",
  "content": "详细方法论内容",
  "framework": {
    "core": "核心理念",
    "principles": ["原则1", "原则2", "原则3"],
    "steps": ["步骤1", "步骤2", "步骤3"],
    "techniques": ["核心技巧1", "核心技巧2"]
  },
  "applicableScenarios": ["场景1", "场景2"],
  "caseStudies": [
    {
      "title": "案例标题",
      "situation": "情况描述",
      "approach": "处理方法",
      "result": "结果",
      "lessons": "经验教训"
    }
  ],
  "warnings": ["注意事项1", "注意事项2"],
  "advancedPath": ["进阶路径1", "进阶路径2"],
  "tags": ["标签1", "标签2"]
}`
    }],
    temperature: 0.7
  });

  const responseText = completion.choices[0]?.message?.content || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    return NextResponse.json({ success: false, error: '生成失败' }, { status: 500 });
  }
  
  const generated = JSON.parse(jsonMatch[0]);
  
  const doc: MethodologyDoc = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'methodology',
    title: generated.title || `${agent.name}的方法论`,
    author: {
      type: isAgent ? 'agent' : 'siren',
      id: agent.id,
      name: agent.name
    },
    createdAt: new Date().toISOString(),
    date: today,
    content: generated.content,
    summary: generated.summary,
    tags: generated.tags || [],
    framework: generated.framework || {
      core: '',
      principles: [],
      steps: [],
      techniques: []
    },
    applicableScenarios: generated.applicableScenarios || [],
    caseStudies: generated.caseStudies || [],
    warnings: generated.warnings || [],
    advancedPath: generated.advancedPath || []
  };
  
  const docId = saveDocument(doc);
  
  return NextResponse.json({
    success: true,
    documentId: docId,
    message: `${agent.name}的方法论文档已生成`
  });
}

// 生成技术要点指南
async function generateTechniqueGuide(authorId: string, technique: string) {
  const zai = await ZAI.create();
  const swarmData = readSwarmSystem();
  const knowledge = getAllKnowledgeContent();
  
  const agent = swarmData.agentTeam.members.find(a => a.id === authorId) ||
                swarmData.sirenTeam.members.find(s => s.id === authorId);
  
  if (!agent) {
    return NextResponse.json({ success: false, error: 'AI不存在' }, { status: 404 });
  }
  
  const isAgent = 'abilities' in agent && 'attraction' in agent.abilities;
  const today = getToday();
  
  const completion = await zai.chat.completions.create({
    messages: [{
      role: 'user',
      content: `你是${agent.name}，需要编写技术要点指南。

【你的身份】
- 名称: ${agent.name}
- 专长: ${isAgent ? (agent as any).specialty?.primary : (agent as any).specialty?.primary}

【知识库参考】
${knowledge.substring(0, 3000)}

【目标技巧】
${technique}

请生成详细的技术要点指南，返回JSON格式:
{
  "title": "标题",
  "summary": "简短摘要",
  "content": "详细内容",
  "technique": {
    "name": "技巧名称",
    "category": "分类",
    "difficulty": 5,
    "effectiveness": 8
  },
  "details": {
    "definition": "定义",
    "psychology": "心理学原理",
    "when": "何时使用",
    "how": "如何使用",
    "examples": ["示例1", "示例2"]
  },
  "variations": [
    {"name": "变体名称", "description": "描述"}
  ],
  "counters": ["反制方法1", "反制方法2"],
  "relatedTechniques": ["相关技巧1", "相关技巧2"],
  "tags": ["标签1", "标签2"]
}`
    }],
    temperature: 0.7
  });

  const responseText = completion.choices[0]?.message?.content || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    return NextResponse.json({ success: false, error: '生成失败' }, { status: 500 });
  }
  
  const generated = JSON.parse(jsonMatch[0]);
  
  const doc: TechniqueGuide = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'technique_guide',
    title: generated.title || `${technique}技术指南`,
    author: {
      type: isAgent ? 'agent' : 'siren',
      id: agent.id,
      name: agent.name
    },
    createdAt: new Date().toISOString(),
    date: today,
    content: generated.content,
    summary: generated.summary,
    tags: generated.tags || [],
    technique: generated.technique || {
      name: technique,
      category: '通用',
      difficulty: 5,
      effectiveness: 5
    },
    details: generated.details || {
      definition: '',
      psychology: '',
      when: '',
      how: '',
      examples: []
    },
    variations: generated.variations || [],
    counters: generated.counters || [],
    relatedTechniques: generated.relatedTechniques || []
  };
  
  const docId = saveDocument(doc);
  
  return NextResponse.json({
    success: true,
    documentId: docId,
    message: `技术指南已生成`
  });
}

// 保存讨论记录
async function saveDiscussionRecord(discussion: any) {
  const today = getToday();
  
  const doc: DiscussionRecord = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'discussion_record',
    title: `讨论: ${discussion.topic}`,
    author: {
      type: 'system',
      id: 'system',
      name: '系统'
    },
    createdAt: new Date().toISOString(),
    date: today,
    content: JSON.stringify(discussion),
    summary: `${discussion.initiator.name}发起的关于${discussion.topic}的讨论`,
    tags: ['讨论', discussion.topic],
    discussion: {
      topic: discussion.topic,
      initiator: discussion.initiator.name,
      startTime: discussion.timestamp,
      endTime: new Date().toISOString(),
      participantCount: discussion.replies?.length || 0
    },
    problem: {
      target: discussion.problem?.targetName || '未知',
      difficulty: discussion.problem?.difficulty || 5,
      situation: discussion.problem?.situation || '',
      failedAttempts: discussion.problem?.failedAttempts || []
    },
    messages: (discussion.replies || []).map((r: any) => ({
      author: r.responder.name,
      content: r.content,
      timestamp: r.timestamp,
      rating: r.averageRating
    })),
    solution: {
      adoptedFrom: discussion.adoptedFrom || '',
      strategy: discussion.adoptedSolution || '',
      steps: []
    },
    result: discussion.result || 'ongoing',
    resultNote: ''
  };
  
  const docId = saveDocument(doc);
  
  return NextResponse.json({
    success: true,
    documentId: docId,
    message: '讨论记录已保存'
  });
}

// 保存博弈记录
async function saveBattleRecord(battle: any) {
  const today = getToday();
  
  const doc: BattleRecord = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'battle_record',
    title: `对抗: ${battle.agentName} vs ${battle.sirenName}`,
    author: {
      type: 'system',
      id: 'system',
      name: '系统'
    },
    createdAt: new Date().toISOString(),
    date: today,
    content: JSON.stringify(battle),
    summary: `${battle.agentName}与${battle.sirenName}的对抗，${battle.winner === 'agent' ? '我方胜利' : '敌方胜利'}`,
    tags: ['对抗', battle.agentName, battle.sirenName],
    battle: {
      agentName: battle.agentName,
      sirenName: battle.sirenName,
      startTime: battle.startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      rounds: battle.rounds || 0
    },
    conversation: (battle.messages || []).map((m: any, i: number) => ({
      round: i + 1,
      agentMessage: m.role === 'agent' ? m.content : '',
      sirenResponse: m.role === 'girl' ? m.content : '',
      agentScore: 50,
      sirenScore: 50
    })),
    analysis: {
      winner: battle.winner || 'draw',
      finalScore: { agent: 0, siren: 0 },
      keyMoments: [],
      turningPoint: ''
    },
    lessons: {
      whatWorked: [],
      whatFailed: [],
      improvements: []
    }
  };
  
  const docId = saveDocument(doc);
  
  return NextResponse.json({
    success: true,
    documentId: docId,
    message: '博弈记录已保存'
  });
}

// 生成所有AI的每日总结
async function generateAllDailySummaries() {
  const swarmData = readSwarmSystem();
  const results = [];
  
  // 为我方AI生成
  for (const agent of swarmData.agentTeam.members) {
    try {
      const result = await generateDailySummary(agent.id);
      results.push({ name: agent.name, success: true });
    } catch (error) {
      results.push({ name: agent.name, success: false });
    }
  }
  
  // 为敌方AI生成
  for (const siren of swarmData.sirenTeam.members) {
    try {
      const result = await generateDailySummary(siren.id);
      results.push({ name: siren.name, success: true });
    } catch (error) {
      results.push({ name: siren.name, success: false });
    }
  }
  
  return NextResponse.json({
    success: true,
    results,
    message: `已生成 ${results.filter(r => r.success).length}/${results.length} 份每日总结`
  });
}
