import fs from 'fs';
import path from 'path';

// AI女生角色类型
export interface AIGirl {
  id: string;
  name: string;
  age: number;
  
  // 外貌
  appearance: {
    beauty: number; // 1-10
    style: string;
    features: string;
  };
  
  // 职业
  occupation: string;
  income: 'low' | 'medium' | 'high' | 'very_high';
  
  // 性格
  personality: {
    type: string; // 冷淡、热情、害羞、霸道、傲娇、温柔等
    traits: string[];
    mbti?: string;
  };
  
  // 情感状态
  relationshipStatus: 'single' | 'dating' | 'complicated' | 'just_broke_up' | 'married';
  
  // 情感需求
  emotionalNeeds: string[];
  
  // 喜好
  likes: string[];
  dislikes: string[];
  
  // 防御机制
  defenses: string[];
  weaknesses: string[];
  
  // 难度
  difficulty: number; // 1-10
  
  // 当前状态
  currentMood: string;
  interestLevel: number; // 0-100
  trustLevel: number; // 0-100
  attractionLevel: number; // 0-100
  
  // 关系阶段
  stage: 'stranger' | 'acquaintance' | 'friend' | 'dating' | 'relationship' | 'deep';
  
  // 互动历史
  interactionCount: number;
  lastInteraction?: string;
  
  // 是否被攻略
  conquered: boolean;
  conqueredAt?: string;
}

// 练习会话
export interface PracticeSession {
  id: string;
  girlId: string;
  girl: AIGirl;
  
  // 会话信息
  startTime: string;
  endTime?: string;
  messages: PracticeMessage[];
  
  // 结果
  result: {
    success: boolean;
    finalInterest: number;
    finalTrust: number;
    finalAttraction: number;
    stageReached: string;
    techniques: string[];
    mistakes: string[];
  };
  
  // AI评估
  evaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
}

// 练习消息
export interface PracticeMessage {
  role: 'agent' | 'girl';
  content: string;
  timestamp: string;
  
  // 女生反应
  emotion?: string;
  internalThought?: string;
  
  // 技巧识别
  techniqueUsed?: string;
  effectiveness?: number;
}

// 练习统计
export interface PracticeStats {
  totalSessions: number;
  totalMessages: number;
  
  // 攻略统计
  conqueredCount: number;
  conquestRate: number;
  
  // 各类型攻略率
  conquestByType: Record<string, { total: number; conquered: number }>;
  conquestByDifficulty: Record<number, { total: number; conquered: number }>;
  
  // 技能统计
  techniqueStats: Record<string, { used: number; success: number }>;
  
  // 平均得分
  averageScore: number;
  
  // 连续成功
  currentStreak: number;
  bestStreak: number;
}

// 练习状态文件
const PRACTICE_FILE = path.join(process.cwd(), 'data', 'practice-data.json');

// 角色模板
const GIRL_TEMPLATES = {
  // 性格类型
  personalities: [
    { type: '冰山美人', traits: ['冷淡', '高傲', '难以接近'], defenses: ['冷漠', '敷衍', '拒绝'] },
    { type: '傲娇公主', traits: ['嘴硬心软', '爱面子', '别扭'], defenses: ['否认', '反驳', '装不在乎'] },
    { type: '温柔姐姐', traits: ['体贴', '成熟', '包容'], defenses: ['礼貌距离', '委婉拒绝'] },
    { type: '活泼少女', traits: ['开朗', '直接', '热情'], defenses: ['转移话题', '装傻'] },
    { type: '高冷总裁', traits: ['强势', '独立', '理性'], defenses: ['工作忙', '公事公办', '保持距离'] },
    { type: '文艺女神', traits: ['敏感', '浪漫', '理想主义'], defenses: ['精神出轨', '不切实际'] },
    { type: '绿茶婊', traits: ['装纯', '心机', '利用'], defenses: ['装可怜', '挑拨', '暧昧'] },
    { type: '女汉子', traits: ['豪爽', '直接', '不拘小节'], defenses: ['当兄弟', '不把你当男人'] },
    { type: '小公主', traits: ['娇气', '任性', '需要宠爱'], defenses: ['发脾气', '冷战', '考验'] },
    { type: '知性女神', traits: ['聪明', '独立', '有主见'], defenses: ['理性分析', '不轻易动心'] },
    { type: '邻家女孩', traits: ['单纯', '善良', '好追'], defenses: ['害羞', '犹豫'] },
    { type: '夜店女王', traits: ['开放', '经验丰富', '难定心'], defenses: ['玩玩而已', '不缺男人'] },
  ],
  
  // 职业
  occupations: [
    { name: '大学生', income: 'low' as const },
    { name: '研究生', income: 'low' as const },
    { name: '护士', income: 'medium' as const },
    { name: '老师', income: 'medium' as const },
    { name: '白领', income: 'medium' as const },
    { name: '销售', income: 'medium' as const },
    { name: '网红', income: 'high' as const },
    { name: '模特', income: 'high' as const },
    { name: '企业高管', income: 'very_high' as const },
    { name: '创业者', income: 'very_high' as const },
    { name: '富二代', income: 'very_high' as const },
    { name: '空姐', income: 'high' as const },
    { name: '主播', income: 'high' as const },
    { name: '公务员', income: 'medium' as const },
    { name: '医生', income: 'high' as const },
    { name: '律师', income: 'very_high' as const },
  ],
  
  // 情感状态
  relationshipStatuses: [
    { status: 'single' as const, weight: 40 },
    { status: 'dating' as const, weight: 20 },
    { status: 'complicated' as const, weight: 15 },
    { status: 'just_broke_up' as const, weight: 15 },
    { status: 'married' as const, weight: 10 },
  ],
  
  // 名字
  names: [
    '小雨', '思琪', '雅婷', '诗涵', '梦瑶', '欣怡', '佳琪', '紫萱',
    '雨萱', '梓涵', '思雨', '雅琳', '诗琪', '梦婷', '欣悦', '佳怡',
    '芷若', '语嫣', '婉清', '灵儿', '如烟', '若雪', '倾城', '落霞',
    '安娜', '丽莎', '艾米', '苏菲', '露西', '艾琳', '薇薇', '安琪'
  ]
};

// 初始化练习数据
function initPracticeData() {
  return {
    girls: [] as AIGirl[],
    sessions: [] as PracticeSession[],
    stats: {
      totalSessions: 0,
      totalMessages: 0,
      conqueredCount: 0,
      conquestRate: 0,
      conquestByType: {},
      conquestByDifficulty: {},
      techniqueStats: {},
      averageScore: 0,
      currentStreak: 0,
      bestStreak: 0
    } as PracticeStats,
    isAutoPracticing: false,
    currentSession: null as PracticeSession | null
  };
}

// 确保数据目录
function ensureDataDir() {
  const dir = path.dirname(PRACTICE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 读取练习数据
export function readPracticeData() {
  try {
    ensureDataDir();
    if (!fs.existsSync(PRACTICE_FILE)) {
      const initial = initPracticeData();
      fs.writeFileSync(PRACTICE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(PRACTICE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取练习数据失败:', error);
    return initPracticeData();
  }
}

// 保存练习数据
export function savePracticeData(data: any) {
  try {
    ensureDataDir();
    fs.writeFileSync(PRACTICE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存练习数据失败:', error);
  }
}

// 生成随机AI女生角色
export function generateRandomGirl(): AIGirl {
  const personality = GIRL_TEMPLATES.personalities[Math.floor(Math.random() * GIRL_TEMPLATES.personalities.length)];
  const occupation = GIRL_TEMPLATES.occupations[Math.floor(Math.random() * GIRL_TEMPLATES.occupations.length)];
  
  // 加权随机选择情感状态
  const statusWeights = GIRL_TEMPLATES.relationshipStatuses;
  const totalWeight = statusWeights.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  let relationshipStatus = 'single' as const;
  for (const s of statusWeights) {
    random -= s.weight;
    if (random <= 0) {
      relationshipStatus = s.status;
      break;
    }
  }
  
  const name = GIRL_TEMPLATES.names[Math.floor(Math.random() * GIRL_TEMPLATES.names.length)];
  const age = 18 + Math.floor(Math.random() * 22); // 18-40
  const beauty = Math.floor(Math.random() * 5) + 6; // 6-10
  
  // 难度计算
  let difficulty = 5;
  if (personality.type === '冰山美人' || personality.type === '高冷总裁') difficulty += 2;
  if (personality.type === '绿茶婊') difficulty += 1;
  if (personality.type === '邻家女孩') difficulty -= 2;
  if (occupation.income === 'very_high') difficulty += 1;
  if (relationshipStatus === 'married') difficulty += 2;
  if (relationshipStatus === 'dating') difficulty += 1;
  difficulty = Math.max(1, Math.min(10, difficulty));
  
  return {
    id: `girl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    age,
    appearance: {
      beauty,
      style: ['清纯', '性感', '知性', '可爱', '御姐', '文艺'][Math.floor(Math.random() * 6)],
      features: ['大眼睛', '长腿', '白皮肤', '好身材', '甜美笑容'][Math.floor(Math.random() * 5)]
    },
    occupation: occupation.name,
    income: occupation.income,
    personality: {
      type: personality.type,
      traits: personality.traits,
      mbti: ['INTJ', 'INFJ', 'ENFP', 'ISFP', 'ENTP', 'ESFJ'][Math.floor(Math.random() * 6)]
    },
    relationshipStatus,
    emotionalNeeds: ['安全感', '被理解', '新鲜感', '被尊重', '陪伴', '物质'][Math.floor(Math.random() * 6)],
    likes: ['旅行', '美食', '电影', '购物', '健身', '读书', '音乐'][Math.floor(Math.random() * 7)],
    dislikes: ['油腻', '无聊', '抠门', '自大', '邋遢'][Math.floor(Math.random() * 5)],
    defenses: personality.defenses,
    weaknesses: ['真诚', '幽默', '自信', '细心', '有才华'][Math.floor(Math.random() * 5)],
    difficulty,
    currentMood: '平静',
    interestLevel: Math.floor(Math.random() * 30) + 10,
    trustLevel: Math.floor(Math.random() * 20) + 5,
    attractionLevel: Math.floor(Math.random() * 20),
    stage: 'stranger',
    interactionCount: 0,
    conquered: false
  };
}

// 生成一批不同类型的女生
export function generateDiverseGirls(count: number): AIGirl[] {
  const girls: AIGirl[] = [];
  
  // 确保覆盖各种类型
  const types = [
    '冰山美人', '傲娇公主', '温柔姐姐', '活泼少女', '高冷总裁',
    '文艺女神', '绿茶婊', '女汉子', '小公主', '知性女神',
    '邻家女孩', '夜店女王'
  ];
  
  for (let i = 0; i < count; i++) {
    const girl = generateRandomGirl();
    // 确保类型多样性
    if (i < types.length) {
      const template = GIRL_TEMPLATES.personalities.find(p => p.type === types[i]);
      if (template) {
        girl.personality.type = template.type;
        girl.personality.traits = template.traits;
        girl.defenses = template.defenses;
      }
    }
    girls.push(girl);
  }
  
  return girls;
}

// 更新女生状态
export function updateGirlStatus(girlId: string, updates: Partial<AIGirl>): AIGirl | null {
  const data = readPracticeData();
  const index = data.girls.findIndex(g => g.id === girlId);
  
  if (index === -1) return null;
  
  data.girls[index] = { ...data.girls[index], ...updates };
  savePracticeData(data);
  
  return data.girls[index];
}

// 添加练习会话
export function addPracticeSession(session: PracticeSession) {
  const data = readPracticeData();
  data.sessions.unshift(session);
  
  // 更新统计
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
  data.stats.averageScore = (data.stats.averageScore * (data.stats.totalSessions - 1) + session.evaluation.score) / data.stats.totalSessions;
  
  savePracticeData(data);
}

// 获取待练习的女生
export function getGirlsToPractice(count: number): AIGirl[] {
  const data = readPracticeData();
  
  // 如果女生不够，生成新的
  if (data.girls.length < count) {
    const newGirls = generateDiverseGirls(count - data.girls.length);
    data.girls.push(...newGirls);
    savePracticeData(data);
  }
  
  // 优先选择未攻略的、互动少的
  return data.girls
    .filter(g => !g.conquered)
    .sort((a, b) => a.interactionCount - b.interactionCount)
    .slice(0, count);
}
