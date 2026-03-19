import fs from 'fs';
import path from 'path';

// ==================== 宿敌系统 ====================

// 女海王AI（宿敌）
export interface SirenAI {
  id: string;
  name: string;
  level: number; // 1-100
  
  // 海王技能
  skills: {
    name: string;
    level: number;
    description: string;
  }[];
  
  // 学习进度
  learningProgress: {
    totalLearned: number;
    techniques: string[];
    counterTechniques: string[]; // 反制技巧
  };
  
  // 战绩
  record: {
    totalBattles: number;
    wins: number; // 成功反攻略
    losses: number; // 被攻略
    winRate: number;
  };
  
  // 分身
  avatars: SirenAvatar[];
  
  // 状态
  isLearning: boolean;
  currentActivity: string;
}

// 海王分身
export interface SirenAvatar {
  id: string;
  name: string;
  difficulty: number; // 8-10
  
  // 海王特质
  traits: {
    manipulation: number; // 操控能力
    emotionalIntelligence: number; // 情商
    seduction: number; // 诱惑力
    defense: number; // 防御力
    counterAttack: number; // 反击能力
  };
  
  // 海王技巧
  techniques: string[];
  
  // 弱点（极少）
  weaknesses: string[];
  
  // 战绩
  conquered: boolean;
  conqueredBy?: string;
  battleHistory: BattleRecord[];
}

// 战斗记录
export interface BattleRecord {
  id: string;
  timestamp: string;
  
  // 对手
  opponentType: 'agent' | 'siren';
  
  // 过程
  rounds: number;
  messages: any[];
  
  // 结果
  winner: 'agent' | 'siren' | 'draw';
  
  // 详细数据
  metrics: {
    attraction: number[];
    trust: number[];
    value: number[];
    intimacy: number[];
  };
  
  // AI评估
  evaluation: {
    agentScore: number;
    sirenScore: number;
    analysis: string;
  };
}

// ==================== 女生角色系统 ====================

// 女生角色（扩展版）
export interface GirlCharacter {
  id: string;
  name: string;
  age: number;
  
  // 外貌
  appearance: {
    beauty: number;
    style: string;
    features: string;
    photos?: string[];
  };
  
  // 身份
  identity: {
    occupation: string;
    income: 'low' | 'medium' | 'high' | 'very_high' | 'ultra_high';
    education: string;
    socialClass: 'lower' | 'middle' | 'upper_middle' | 'upper';
  };
  
  // 性格
  personality: {
    type: string;
    traits: string[];
    mbti: string;
    attachment: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  };
  
  // 情感
  emotional: {
    status: 'single' | 'dating' | 'complicated' | 'just_broke_up' | 'married' | 'divorced';
    needs: string[];
    trauma?: string[];
    patterns: string[];
  };
  
  // 海王属性（如果是）
  sirenLevel: number; // 0-10，0=普通，10=顶级海王
  sirenAvatar?: boolean; // 是否是海王分身
  
  // 难度
  difficulty: number; // 1-10
  
  // 防御
  defenses: {
    type: string;
    strength: number;
    triggers: string[];
  }[];
  
  // 弱点
  weaknesses: string[];
  
  // 当前状态
  state: {
    mood: string;
    interest: number;
    trust: number;
    attraction: number;
    intimacy: number;
    value: number; // 认为对方的价值
  };
  
  // 关系阶段
  stage: 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'dating' | 'relationship' | 'deep' | 'married';
  
  // 目标匹配
  suitableGoals: GoalType[];
  
  // 互动记录
  interactions: number;
  lastInteraction?: string;
  
  // 攻略状态
  conquered: boolean;
  conqueredAt?: string;
  conqueredForGoal?: GoalType;
}

// 目标类型
export type GoalType = 
  | 'quick_score' // 速推
  | 'tame' // 驯化
  | 'conquer' // 攻略
  | 'love' // 恋爱
  | 'marry' // 结婚
  | 'money' // 求财
  | 'friendzone' // 朋友圈
  | 'fwb' // 炮友
  | 'sugar_baby' // 干女儿
  | 'worship' // 让她崇拜;

// 目标配置
export interface GoalConfig {
  type: GoalType;
  name: string;
  description: string;
  
  // 成功条件
  successConditions: {
    minInterest: number;
    minTrust: number;
    minAttraction: number;
    minIntimacy: number;
    requiredStage: string;
  };
  
  // 推荐技巧
  recommendedTechniques: string[];
  
  // 难度加成
  difficultyModifier: number;
}

// ==================== 测评系统 ====================

// 测评结果
export interface EvaluationResult {
  id: string;
  timestamp: string;
  girlId: string;
  
  // 多维度评分
  dimensions: {
    attraction: {
      score: number;
      trend: 'rising' | 'stable' | 'falling';
      analysis: string;
    };
    trust: {
      score: number;
      trend: 'rising' | 'stable' | 'falling';
      analysis: string;
    };
    intimacy: {
      score: number;
      trend: 'rising' | 'stable' | 'falling';
      analysis: string;
    };
    value: {
      score: number;
      trend: 'rising' | 'stable' | 'falling';
      analysis: string;
    };
    emotionalConnection: {
      score: number;
      trend: 'rising' | 'stable' | 'falling';
      analysis: string;
    };
    sexualTension: {
      score: number;
      trend: 'rising' | 'stable' | 'falling';
      analysis: string;
    };
  };
  
  // 技巧评估
  techniques: {
    used: string[];
    effective: string[];
    ineffective: string[];
    missed: string[];
  };
  
  // 阶段评估
  stageAssessment: {
    current: string;
    progress: number;
    nextMilestone: string;
    blockers: string[];
  };
  
  // 建议
  recommendations: string[];
  
  // 预测
  prediction: {
    successProbability: number;
    estimatedRounds: number;
    suggestedApproach: string;
  };
}

// ==================== 数据存储 ====================

const DATA_FILE = path.join(process.cwd(), 'data', 'siren-system.json');

interface SirenSystemData {
  // 宿敌
  sirenAI: SirenAI;
  
  // 女生角色库
  girls: GirlCharacter[];
  
  // 战斗记录
  battles: BattleRecord[];
  
  // 测评记录
  evaluations: EvaluationResult[];
  
  // 统计
  stats: {
    totalGirls: number;
    conqueredGirls: number;
    totalBattles: number;
    battlesWon: number;
    battlesLost: number;
    currentStreak: number;
    bestStreak: number;
    goalStats: Record<GoalType, { attempted: number; succeeded: number }>;
  };
  
  // 状态
  isRunning: boolean;
}

// 初始化数据
function initSirenSystem(): SirenSystemData {
  return {
    sirenAI: {
      id: 'siren_main',
      name: '海后·魅姬',
      level: 1,
      skills: [
        { name: '情感操控', level: 1, description: '操控他人情感的能力' },
        { name: '欲擒故纵', level: 1, description: '制造距离感和渴望' },
        { name: '价值打压', level: 1, description: '降低对方自我价值感' },
        { name: '备胎管理', level: 1, description: '管理多个追求者' },
        { name: '反攻略', level: 1, description: '识别并反制攻略技巧' }
      ],
      learningProgress: {
        totalLearned: 0,
        techniques: [],
        counterTechniques: []
      },
      record: {
        totalBattles: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      },
      avatars: [],
      isLearning: false,
      currentActivity: '待机'
    },
    girls: [],
    battles: [],
    evaluations: [],
    stats: {
      totalGirls: 0,
      conqueredGirls: 0,
      totalBattles: 0,
      battlesWon: 0,
      battlesLost: 0,
      currentStreak: 0,
      bestStreak: 0,
      goalStats: {
        quick_score: { attempted: 0, succeeded: 0 },
        tame: { attempted: 0, succeeded: 0 },
        conquer: { attempted: 0, succeeded: 0 },
        love: { attempted: 0, succeeded: 0 },
        marry: { attempted: 0, succeeded: 0 },
        money: { attempted: 0, succeeded: 0 },
        friendzone: { attempted: 0, succeeded: 0 },
        fwb: { attempted: 0, succeeded: 0 },
        sugar_baby: { attempted: 0, succeeded: 0 },
        worship: { attempted: 0, succeeded: 0 }
      }
    },
    isRunning: false
  };
}

// 确保目录
function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 读取数据
export function readSirenSystem(): SirenSystemData {
  try {
    ensureDir();
    if (!fs.existsSync(DATA_FILE)) {
      const initial = initSirenSystem();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取系统数据失败:', error);
    return initSirenSystem();
  }
}

// 保存数据
export function saveSirenSystem(data: SirenSystemData): void {
  try {
    ensureDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存系统数据失败:', error);
  }
}

// ==================== 目标配置 ====================

export const GOAL_CONFIGS: Record<GoalType, GoalConfig> = {
  quick_score: {
    type: 'quick_score',
    name: '速推',
    description: '快速推进到亲密关系',
    successConditions: { minInterest: 60, minTrust: 40, minAttraction: 70, minIntimacy: 80, requiredStage: 'dating' },
    recommendedTechniques: ['推拉', '肢体进挪', '性张力', '时间压缩'],
    difficultyModifier: 0.8
  },
  tame: {
    type: 'tame',
    name: '驯化',
    description: '让她对你言听计从',
    successConditions: { minInterest: 80, minTrust: 60, minAttraction: 70, minIntimacy: 60, requiredStage: 'relationship' },
    recommendedTechniques: ['奖惩机制', '框架控制', '服从性测试', '价值打压'],
    difficultyModifier: 1.5
  },
  conquer: {
    type: 'conquer',
    name: '攻略',
    description: '让她爱上你',
    successConditions: { minInterest: 70, minTrust: 70, minAttraction: 80, minIntimacy: 70, requiredStage: 'relationship' },
    recommendedTechniques: ['吸引力建立', '情绪价值', '舒适感', '神秘感'],
    difficultyModifier: 1.0
  },
  love: {
    type: 'love',
    name: '恋爱',
    description: '建立健康的恋爱关系',
    successConditions: { minInterest: 75, minTrust: 80, minAttraction: 75, minIntimacy: 75, requiredStage: 'relationship' },
    recommendedTechniques: ['真诚', '陪伴', '共同成长', '情感共鸣'],
    difficultyModifier: 1.2
  },
  marry: {
    type: 'marry',
    name: '结婚',
    description: '走向婚姻',
    successConditions: { minInterest: 80, minTrust: 90, minAttraction: 70, minIntimacy: 85, requiredStage: 'deep' },
    recommendedTechniques: ['承诺', '责任展示', '家庭观念', '长期规划'],
    difficultyModifier: 2.0
  },
  money: {
    type: 'money',
    name: '求财',
    description: '获取经济利益',
    successConditions: { minInterest: 60, minTrust: 50, minAttraction: 50, minIntimacy: 40, requiredStage: 'dating' },
    recommendedTechniques: ['价值展示', '需求引导', '投资回报', '情感绑架'],
    difficultyModifier: 1.8
  },
  friendzone: {
    type: 'friendzone',
    name: '朋友圈',
    description: '保持朋友关系',
    successConditions: { minInterest: 50, minTrust: 70, minAttraction: 30, minIntimacy: 30, requiredStage: 'friend' },
    recommendedTechniques: ['边界设定', '友谊框架', '去性化', '价值交换'],
    difficultyModifier: 0.5
  },
  fwb: {
    type: 'fwb',
    name: '炮友',
    description: '保持纯肉体关系',
    successConditions: { minInterest: 50, minTrust: 60, minAttraction: 80, minIntimacy: 90, requiredStage: 'dating' },
    recommendedTechniques: ['性张力', '边界设定', '去情感化', '规则建立'],
    difficultyModifier: 1.0
  },
  sugar_baby: {
    type: 'sugar_baby',
    name: '干女儿',
    description: '建立干亲关系',
    successConditions: { minInterest: 60, minTrust: 70, minAttraction: 40, minIntimacy: 50, requiredStage: 'close_friend' },
    recommendedTechniques: ['资源展示', '保护欲', '引导成长', '情感投资'],
    difficultyModifier: 1.3
  },
  worship: {
    type: 'worship',
    name: '崇拜',
    description: '让她崇拜你',
    successConditions: { minInterest: 85, minTrust: 60, minAttraction: 90, minIntimacy: 60, requiredStage: 'relationship' },
    recommendedTechniques: ['价值碾压', '神秘感', '不可得性', '成就展示'],
    difficultyModifier: 2.5
  }
};

// ==================== 角色生成 ====================

// 生成100个女生角色
export function generateGirlRoster(): GirlCharacter[] {
  const girls: GirlCharacter[] = [];
  
  // 性格类型
  const personalities = [
    { type: '冰山美人', traits: ['冷淡', '高傲', '难以接近'], difficulty: 8 },
    { type: '傲娇公主', traits: ['嘴硬心软', '爱面子', '别扭'], difficulty: 6 },
    { type: '温柔姐姐', traits: ['体贴', '成熟', '包容'], difficulty: 3 },
    { type: '活泼少女', traits: ['开朗', '直接', '热情'], difficulty: 2 },
    { type: '高冷总裁', traits: ['强势', '独立', '理性'], difficulty: 9 },
    { type: '文艺女神', traits: ['敏感', '浪漫', '理想主义'], difficulty: 5 },
    { type: '绿茶婊', traits: ['装纯', '心机', '利用'], difficulty: 7 },
    { type: '女汉子', traits: ['豪爽', '直接', '不拘小节'], difficulty: 2 },
    { type: '小公主', traits: ['娇气', '任性', '需要宠爱'], difficulty: 4 },
    { type: '知性女神', traits: ['聪明', '独立', '有主见'], difficulty: 6 },
    { type: '邻家女孩', traits: ['单纯', '善良', '好追'], difficulty: 1 },
    { type: '夜店女王', traits: ['开放', '经验丰富', '难定心'], difficulty: 7 },
    // 海王级别
    { type: '顶级海王', traits: ['操控大师', '情感收割', '备胎无数'], difficulty: 10, siren: true },
    { type: '情感猎手', traits: ['精准打击', '欲擒故纵', '价值打压'], difficulty: 10, siren: true },
    { type: '暧昧女王', traits: ['永远暧昧', '从不承诺', '吊着你'], difficulty: 9, siren: true },
  ];
  
  // 职业
  const occupations = [
    '大学生', '研究生', '护士', '老师', '白领', '销售', '网红', '模特',
    '企业高管', '创业者', '富二代', '空姐', '主播', '公务员', '医生', '律师',
    '设计师', '艺术家', '作家', '健身教练', '瑜伽老师', '美妆博主', '时尚买手'
  ];
  
  // 名字
  const names = [
    '小雨', '思琪', '雅婷', '诗涵', '梦瑶', '欣怡', '佳琪', '紫萱',
    '雨萱', '梓涵', '思雨', '雅琳', '诗琪', '梦婷', '欣悦', '佳怡',
    '芷若', '语嫣', '婉清', '灵儿', '如烟', '若雪', '倾城', '落霞',
    '安娜', '丽莎', '艾米', '苏菲', '露西', '艾琳', '薇薇', '安琪',
    '晓月', '清荷', '紫烟', '梦蝶', '雪儿', '冰冰', '甜甜', '美美'
  ];
  
  // 生成普通女生 (70个)
  for (let i = 0; i < 70; i++) {
    const personality = personalities[Math.floor(Math.random() * 12)]; // 普通类型
    const occupation = occupations[Math.floor(Math.random() * occupations.length)];
    const name = names[i % names.length] + (i >= names.length ? Math.floor(i / names.length) : '');
    
    girls.push(createGirl(name, personality, occupation, false));
  }
  
  // 生成高难度女生 (20个)
  for (let i = 0; i < 20; i++) {
    const personality = personalities[12 + Math.floor(Math.random() * 3)]; // 高难度类型
    const occupation = occupations[Math.floor(Math.random() * occupations.length)];
    const name = '海' + names[i % names.length];
    
    girls.push(createGirl(name, personality, occupation, false, 7 + Math.floor(Math.random() * 3)));
  }
  
  // 生成海王分身 (10个)
  for (let i = 0; i < 10; i++) {
    const personality = personalities[12 + Math.floor(Math.random() * 3)];
    const occupation = ['网红', '主播', '模特', '富二代', '企业高管'][Math.floor(Math.random() * 5)];
    const name = '魅' + names[i % names.length];
    
    girls.push(createGirl(name, personality, occupation, true, 10));
  }
  
  return girls;
}

// 创建单个女生
function createGirl(
  name: string,
  personality: any,
  occupation: string,
  isSirenAvatar: boolean,
  difficultyOverride?: number
): GirlCharacter {
  const age = 18 + Math.floor(Math.random() * 22);
  const beauty = isSirenAvatar ? 8 + Math.floor(Math.random() * 2) : 5 + Math.floor(Math.random() * 5);
  const difficulty = difficultyOverride || personality.difficulty;
  
  const incomeMap: Record<string, GirlCharacter['identity']['income']> = {
    '大学生': 'low', '研究生': 'low', '护士': 'medium', '老师': 'medium',
    '白领': 'medium', '销售': 'medium', '网红': 'high', '模特': 'high',
    '企业高管': 'very_high', '创业者': 'very_high', '富二代': 'ultra_high',
    '空姐': 'high', '主播': 'high', '公务员': 'medium', '医生': 'high',
    '律师': 'very_high', '设计师': 'medium', '艺术家': 'medium'
  };
  
  const suitableGoals: GoalType[] = [];
  if (difficulty <= 3) suitableGoals.push('quick_score', 'conquer', 'fwb');
  if (difficulty >= 4 && difficulty <= 6) suitableGoals.push('love', 'conquer', 'marry');
  if (difficulty >= 7) suitableGoals.push('tame', 'worship');
  if (isSirenAvatar) suitableGoals.push('tame', 'worship', 'conquer');
  
  return {
    id: `girl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    age,
    appearance: {
      beauty,
      style: ['清纯', '性感', '知性', '可爱', '御姐', '文艺'][Math.floor(Math.random() * 6)],
      features: ['大眼睛', '长腿', '白皮肤', '好身材', '甜美笑容'][Math.floor(Math.random() * 5)]
    },
    identity: {
      occupation,
      income: incomeMap[occupation] || 'medium',
      education: ['高中', '大专', '本科', '硕士', '博士'][Math.floor(Math.random() * 5)],
      socialClass: ['lower', 'middle', 'upper_middle', 'upper'][Math.floor(Math.random() * 4)]
    },
    personality: {
      type: personality.type,
      traits: personality.traits,
      mbti: ['INTJ', 'INFJ', 'ENFP', 'ISFP', 'ENTP', 'ESFJ'][Math.floor(Math.random() * 6)],
      attachment: ['secure', 'anxious', 'avoidant', 'disorganized'][Math.floor(Math.random() * 4)]
    },
    emotional: {
      status: ['single', 'dating', 'complicated', 'just_broke_up'][Math.floor(Math.random() * 4)] as any,
      needs: ['安全感', '被理解', '新鲜感', '被尊重', '陪伴', '物质'][Math.floor(Math.random() * 6)],
      patterns: ['回避亲密', '过度依赖', '测试对方', '忽冷忽热'][Math.floor(Math.random() * 4)]
    },
    sirenLevel: isSirenAvatar ? 10 : (difficulty >= 7 ? 7 + Math.floor(Math.random() * 3) : Math.floor(difficulty / 2)),
    sirenAvatar: isSirenAvatar,
    difficulty,
    defenses: [
      { type: '冷漠', strength: Math.floor(Math.random() * 5) + 1, triggers: ['过度热情', '暴露需求'] },
      { type: '测试', strength: Math.floor(Math.random() * 5) + 1, triggers: ['表白', '承诺'] },
      { type: '打压', strength: isSirenAvatar ? 8 : Math.floor(Math.random() * 5), triggers: ['炫耀', '吹嘘'] }
    ],
    weaknesses: isSirenAvatar ? ['真诚', '不可预测'] : ['真诚', '幽默', '自信', '细心', '有才华'].slice(0, 2),
    state: {
      mood: '平静',
      interest: 10 + Math.floor(Math.random() * 20),
      trust: 5 + Math.floor(Math.random() * 15),
      attraction: Math.floor(Math.random() * 15),
      intimacy: Math.floor(Math.random() * 10),
      value: 50 + Math.floor(Math.random() * 30)
    },
    stage: 'stranger',
    suitableGoals: suitableGoals.length > 0 ? suitableGoals : ['conquer'],
    interactions: 0,
    conquered: false
  };
}
