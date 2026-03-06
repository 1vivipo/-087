import fs from 'fs';
import path from 'path';

// ==================== AI角色系统 ====================

// 我方AI角色
export interface AgentAI {
  id: string;
  name: string;
  avatar: string;
  
  // 专长方向
  specialty: {
    primary: SpecialtyType;      // 主专长
    secondary: SpecialtyType[];  // 副专长
    style: string;               // 风格描述
  };
  
  // 学习方向
  learningFocus: {
    topics: string[];            // 重点学习主题
    depth: 'specialist' | 'generalist'; // 专家型 vs 全能型
  };
  
  // 能力值
  abilities: {
    attraction: number;    // 吸引力建立
    conversation: number;  // 聊天技巧
    psychology: number;    // 心理分析
    strategy: number;      // 战略规划
    adaptation: number;    // 临场应变
    charm: number;         // 个人魅力
  };
  
  // 学习进度
  progress: {
    totalLearned: number;
    totalPracticed: number;
    successRate: number;
    level: number;
    experience: number;
  };
  
  // 擅长攻略的目标类型
  goodAt: string[];
  
  // 弱项
  weaknesses: string[];
  
  // 战绩
  record: {
    battles: number;
    wins: number;
    losses: number;
    draws: number;
  };
  
  // 状态
  status: 'learning' | 'practicing' | 'discussing' | 'resting';
  currentActivity: string;
}

// 敌方AI角色（海王）
export interface SirenAI {
  id: string;
  name: string;
  avatar: string;
  
  // 专长方向
  specialty: {
    primary: SirenSpecialty;
    secondary: SirenSpecialty[];
    style: string;
  };
  
  // 能力值
  abilities: {
    manipulation: number;    // 情感操控
    seduction: number;       // 诱惑力
    defense: number;         // 防御力
    counterAttack: number;   // 反击能力
    emotionalIQ: number;     // 情商
    mindGames: number;       // 心理战
  };
  
  // 学习进度
  progress: {
    totalLearned: number;
    totalDefended: number;
    defenseRate: number;
    level: number;
    experience: number;
  };
  
  // 擅长反制的技巧
  goodAtCountering: string[];
  
  // 弱点
  weaknesses: string[];
  
  // 战绩
  record: {
    defenses: number;
    successes: number;  // 成功防御
    failures: number;   // 被攻略
  };
  
  // 状态
  status: 'learning' | 'defending' | 'discussing' | 'resting';
  currentActivity: string;
}

// 专长类型
export type SpecialtyType = 
  | 'quick_score'      // 速推专家
  | 'long_term'        // 长期关系
  | 'high_difficulty'  // 高难度目标
  | 'psychology'       // 心理分析
  | 'conversation'     // 聊天大师
  | 'attraction'       // 吸引力专家
  | 'taming'           // 驯化专家
  | 'first_impression' // 第一印象
  | 'recovery'         // 挽回专家
  | 'social_circle';   // 社交圈建设

// 海王专长
export type SirenSpecialty =
  | 'emotional_manipulation'  // 情感操控
  | 'friend_zone'             // 朋友圈陷阱
  | 'backup_management'       // 备胎管理
  | 'hot_cold'                // 忽冷忽热
  | 'value_suppression'       // 价值打压
  | 'ambiguity_master'        // 暧昧大师
  | 'commitment_dodge'        // 承诺躲避
  | 'guilt_trip'              // 愧疚陷阱
  | 'jealousy_induction'      // 嫉妒诱导
  | 'attention_control';      // 注意力控制

// ==================== 讨论系统 ====================

// 讨论话题
export interface Discussion {
  id: string;
  timestamp: string;
  
  // 发起者
  initiator: {
    type: 'agent' | 'siren';
    id: string;
    name: string;
  };
  
  // 讨论主题
  topic: string;
  
  // 遇到的问题
  problem: {
    targetId: string;        // 目标女生ID
    targetName: string;
    targetType: string;      // 女生类型
    difficulty: number;
    
    situation: string;       // 当前情况描述
    failedAttempts: string[]; // 失败尝试
    stuckPoint: string;      // 卡住的点
  };
  
  // 参与讨论的回复
  replies: DiscussionReply[];
  
  // 最终采纳的方案
  adoptedSolution?: string;
  adoptedFrom?: string;      // 采纳自哪个AI
  
  // 结果
  result?: 'success' | 'failure' | 'ongoing';
  resultNote?: string;
}

// 讨论回复
export interface DiscussionReply {
  id: string;
  timestamp: string;
  
  // 回复者
  responder: {
    type: 'agent' | 'siren';
    id: string;
    name: string;
    specialty: string;
  };
  
  // 回复内容
  content: string;
  
  // 建议的策略
  suggestedStrategy: {
    name: string;
    description: string;
    steps: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  // 其他AI的评分
  ratings: {
    fromId: string;
    score: number;  // 1-10
    comment: string;
  }[];
  
  // 平均评分
  averageRating: number;
}

// ==================== 集体智慧 ====================

// 集体智慧库
export interface CollectiveWisdom {
  // 成功案例
  successCases: {
    id: string;
    targetType: string;
    difficulty: number;
    strategy: string;
    keyPoints: string[];
    contributor: string;
  }[];
  
  // 失败教训
  failureLessons: {
    id: string;
    targetType: string;
    whatWentWrong: string;
    howToAvoid: string;
    contributor: string;
  }[];
  
  // 技巧库
  techniques: {
    name: string;
    description: string;
    effectiveAgainst: string[];
    riskLevel: string;
    successRate: number;
    contributors: string[];
  }[];
  
  // 反制技巧库（敌方）
  counterTechniques: {
    name: string;
    description: string;
    countersWhat: string[];
    effectiveness: number;
    contributors: string[];
  }[];
}

// ==================== 数据存储 ====================

const SWARM_FILE = path.join(process.cwd(), 'data', 'swarm-system.json');

interface SwarmSystemData {
  // 我方阵营
  agentTeam: {
    members: AgentAI[];
    totalLearned: number;
    totalPracticed: number;
    teamLevel: number;
  };
  
  // 敌方阵营
  sirenTeam: {
    members: SirenAI[];
    totalLearned: number;
    totalDefended: number;
    teamLevel: number;
  };
  
  // 讨论
  discussions: Discussion[];
  activeDiscussions: number;
  
  // 集体智慧
  wisdom: CollectiveWisdom;
  
  // 统计
  stats: {
    totalBattles: number;
    agentWins: number;
    sirenWins: number;
    draws: number;
    discussionsStarted: number;
    discussionsResolved: number;
  };
  
  // 状态
  isRunning: boolean;
}

// 初始化
function initSwarmSystem(): SwarmSystemData {
  return {
    agentTeam: {
      members: createAgentTeam(),
      totalLearned: 0,
      totalPracticed: 0,
      teamLevel: 1
    },
    sirenTeam: {
      members: createSirenTeam(),
      totalLearned: 0,
      totalDefended: 0,
      teamLevel: 1
    },
    discussions: [],
    activeDiscussions: 0,
    wisdom: {
      successCases: [],
      failureLessons: [],
      techniques: [],
      counterTechniques: []
    },
    stats: {
      totalBattles: 0,
      agentWins: 0,
      sirenWins: 0,
      draws: 0,
      discussionsStarted: 0,
      discussionsResolved: 0
    },
    isRunning: false
  };
}

// 创建我方AI团队
function createAgentTeam(): AgentAI[] {
  const agents: AgentAI[] = [
    {
      id: 'agent_001',
      name: '速推大师·闪电',
      avatar: '⚡',
      specialty: {
        primary: 'quick_score',
        secondary: ['attraction', 'conversation'],
        style: '快准狠，速战速决'
      },
      learningFocus: {
        topics: ['速推技巧', '性张力', '时间压缩', '肢体进挪'],
        depth: 'specialist'
      },
      abilities: { attraction: 8, conversation: 7, psychology: 5, strategy: 6, adaptation: 7, charm: 8 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['活泼少女', '夜店女王', '开放型'],
      weaknesses: ['冰山美人', '高难度目标'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_002',
      name: '心理大师·读心',
      avatar: '🧠',
      specialty: {
        primary: 'psychology',
        secondary: ['high_difficulty', 'recovery'],
        style: '洞察人心，精准打击'
      },
      learningFocus: {
        topics: ['心理分析', '冷读术', 'NLP', '情感操控', '依恋理论'],
        depth: 'specialist'
      },
      abilities: { attraction: 6, conversation: 7, psychology: 10, strategy: 8, adaptation: 6, charm: 5 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['冰山美人', '高冷总裁', '复杂型'],
      weaknesses: ['速推场景', '时间紧迫'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_003',
      name: '聊天大师·妙语',
      avatar: '💬',
      specialty: {
        primary: 'conversation',
        secondary: ['attraction', 'first_impression'],
        style: '妙语连珠，风趣幽默'
      },
      learningFocus: {
        topics: ['聊天技巧', '幽默感', '话题延续', '情绪价值', '推拉技巧'],
        depth: 'specialist'
      },
      abilities: { attraction: 7, conversation: 10, psychology: 6, strategy: 5, adaptation: 8, charm: 8 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['活泼少女', '邻家女孩', '文艺女神'],
      weaknesses: ['高冷型', '话少型'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_004',
      name: '驯化大师·掌控',
      avatar: '👑',
      specialty: {
        primary: 'taming',
        secondary: ['psychology', 'long_term'],
        style: '掌控全局，让她臣服'
      },
      learningFocus: {
        topics: ['驯化技巧', '框架控制', '服从性测试', '奖惩机制', '价值打压'],
        depth: 'specialist'
      },
      abilities: { attraction: 7, conversation: 6, psychology: 8, strategy: 9, adaptation: 5, charm: 6 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['小公主', '傲娇公主', '需要被引导型'],
      weaknesses: ['独立型', '强势型'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_005',
      name: '长期专家·守护',
      avatar: '💕',
      specialty: {
        primary: 'long_term',
        secondary: ['recovery', 'social_circle'],
        style: '稳扎稳打，细水长流'
      },
      learningFocus: {
        topics: ['长期关系', '情感维护', '信任建立', '舒适感', '共同成长'],
        depth: 'specialist'
      },
      abilities: { attraction: 6, conversation: 7, psychology: 7, strategy: 6, adaptation: 7, charm: 7 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['温柔姐姐', '知性女神', '稳定型'],
      weaknesses: ['速推场景', '花心型'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_006',
      name: '高难猎手·征服',
      avatar: '🎯',
      specialty: {
        primary: 'high_difficulty',
        secondary: ['psychology', 'attraction'],
        style: '挑战极限，征服不可能'
      },
      learningFocus: {
        topics: ['高难度攻略', '海王反制', '防御突破', '心理战', '持久战'],
        depth: 'specialist'
      },
      abilities: { attraction: 8, conversation: 6, psychology: 9, strategy: 9, adaptation: 8, charm: 6 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['冰山美人', '高冷总裁', '海王级别'],
      weaknesses: ['时间紧迫', '简单目标反而不会'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_007',
      name: '吸引力专家·磁铁',
      avatar: '🧲',
      specialty: {
        primary: 'attraction',
        secondary: ['first_impression', 'conversation'],
        style: '魅力四射，自动吸引'
      },
      learningFocus: {
        topics: ['吸引力建立', '价值展示', '社交认证', '预选效应', '神秘感'],
        depth: 'specialist'
      },
      abilities: { attraction: 10, conversation: 7, psychology: 6, strategy: 5, adaptation: 6, charm: 9 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['各种类型', '社交场合'],
      weaknesses: ['一对一深度沟通'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_008',
      name: '挽回专家·重生',
      avatar: '🔄',
      specialty: {
        primary: 'recovery',
        secondary: ['psychology', 'long_term'],
        style: '绝地反击，起死回生'
      },
      learningFocus: {
        topics: ['挽回技巧', '断联复联', '二次吸引', '错误修复', '信任重建'],
        depth: 'specialist'
      },
      abilities: { attraction: 6, conversation: 7, psychology: 9, strategy: 8, adaptation: 9, charm: 5 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['分手挽回', '关系修复', '错误补救'],
      weaknesses: ['全新目标', '速推场景'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_009',
      name: '全能战士·万金油',
      avatar: '🌟',
      specialty: {
        primary: 'conversation',
        secondary: ['attraction', 'psychology', 'long_term', 'first_impression'],
        style: '全面均衡，随机应变'
      },
      learningFocus: {
        topics: ['全面学习', '各种技巧', '综合应用'],
        depth: 'generalist'
      },
      abilities: { attraction: 7, conversation: 7, psychology: 7, strategy: 7, adaptation: 8, charm: 7 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['各种场景', '适应性强'],
      weaknesses: ['顶级难度', '专精领域'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'agent_010',
      name: '社交达人·人脉',
      avatar: '🤝',
      specialty: {
        primary: 'social_circle',
        secondary: ['attraction', 'first_impression'],
        style: '社交为王，人脉变现'
      },
      learningFocus: {
        topics: ['社交圈建设', '人脉经营', '社交认证', '预选效应', '社交价值'],
        depth: 'specialist'
      },
      abilities: { attraction: 8, conversation: 8, psychology: 6, strategy: 7, adaptation: 6, charm: 9 },
      progress: { totalLearned: 0, totalPracticed: 0, successRate: 0, level: 1, experience: 0 },
      goodAt: ['社交场合', '朋友圈建设', '群体互动'],
      weaknesses: ['一对一深度', '私密场景'],
      record: { battles: 0, wins: 0, losses: 0, draws: 0 },
      status: 'resting',
      currentActivity: '待命'
    }
  ];
  
  return agents;
}

// 创建敌方AI团队
function createSirenTeam(): SirenAI[] {
  const sirens: SirenAI[] = [
    {
      id: 'siren_001',
      name: '情感操控师·织网',
      avatar: '🕸️',
      specialty: {
        primary: 'emotional_manipulation',
        secondary: ['guilt_trip', 'attention_control'],
        style: '操控情感，让你欲罢不能'
      },
      abilities: { manipulation: 10, seduction: 7, defense: 8, counterAttack: 7, emotionalIQ: 9, mindGames: 8 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['速推', '表白', '情感施压'],
      weaknesses: ['真诚', '不按套路出牌'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_002',
      name: '朋友圈大师·距离',
      avatar: '🚧',
      specialty: {
        primary: 'friend_zone',
        secondary: ['ambiguity_master', 'commitment_dodge'],
        style: '永远的朋友，永远的暧昧'
      },
      abilities: { manipulation: 8, seduction: 6, defense: 9, counterAttack: 6, emotionalIQ: 8, mindGames: 7 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['表白', '推进关系', '要求承诺'],
      weaknesses: ['强势推进', '断联'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_003',
      name: '备胎管理师·渔场',
      avatar: '🐟',
      specialty: {
        primary: 'backup_management',
        secondary: ['attention_control', 'jealousy_induction'],
        style: '广撒网，多敛鱼'
      },
      abilities: { manipulation: 9, seduction: 8, defense: 7, counterAttack: 6, emotionalIQ: 8, mindGames: 9 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['独占欲', '吃醋', '竞争心理'],
      weaknesses: ['不在乎', '有其他选择'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_004',
      name: '忽冷忽热·过山车',
      avatar: '🎢',
      specialty: {
        primary: 'hot_cold',
        secondary: ['attention_control', 'emotional_manipulation'],
        style: '让你猜不透，放不下'
      },
      abilities: { manipulation: 8, seduction: 7, defense: 8, counterAttack: 8, emotionalIQ: 7, mindGames: 9 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['习惯性追求', '期待感'],
      weaknesses: ['稳定输出', '不被影响'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_005',
      name: '价值打压师·审判',
      avatar: '⚖️',
      specialty: {
        primary: 'value_suppression',
        secondary: ['guilt_trip', 'emotional_manipulation'],
        style: '让你觉得自己不够好'
      },
      abilities: { manipulation: 9, seduction: 5, defense: 7, counterAttack: 9, emotionalIQ: 8, mindGames: 9 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['讨好', '证明自己', '低姿态'],
      weaknesses: ['高价值展示', '不在乎评价'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_006',
      name: '暧昧女王·迷雾',
      avatar: '🌫️',
      specialty: {
        primary: 'ambiguity_master',
        secondary: ['friend_zone', 'hot_cold'],
        style: '永远给你希望，永远不给你答案'
      },
      abilities: { manipulation: 8, seduction: 9, defense: 8, counterAttack: 7, emotionalIQ: 9, mindGames: 8 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['逼问', '要求明确', '表白'],
      weaknesses: ['不在乎', '有底线'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_007',
      name: '承诺躲避者·幻影',
      avatar: '👻',
      specialty: {
        primary: 'commitment_dodge',
        secondary: ['ambiguity_master', 'friend_zone'],
        style: '承诺？什么承诺？'
      },
      abilities: { manipulation: 7, seduction: 7, defense: 10, counterAttack: 5, emotionalIQ: 8, mindGames: 8 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['要求承诺', '谈未来', '确定关系'],
      weaknesses: ['不要求承诺', '享受当下'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_008',
      name: '愧疚陷阱师·枷锁',
      avatar: '⛓️',
      specialty: {
        primary: 'guilt_trip',
        secondary: ['value_suppression', 'emotional_manipulation'],
        style: '让你愧疚，让你补偿'
      },
      abilities: { manipulation: 9, seduction: 6, defense: 7, counterAttack: 8, emotionalIQ: 9, mindGames: 8 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['愧疚感', '补偿心理', '责任心'],
      weaknesses: ['没心没肺', '自我中心'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_009',
      name: '嫉妒诱导师·醋坛',
      avatar: '🫙',
      specialty: {
        primary: 'jealousy_induction',
        secondary: ['backup_management', 'attention_control'],
        style: '让你吃醋，让你竞争'
      },
      abilities: { manipulation: 8, seduction: 8, defense: 6, counterAttack: 7, emotionalIQ: 7, mindGames: 9 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['占有欲', '竞争心', '吃醋'],
      weaknesses: ['不在乎', '自信'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    },
    {
      id: 'siren_010',
      name: '全能海后·女王',
      avatar: '👸',
      specialty: {
        primary: 'emotional_manipulation',
        secondary: ['hot_cold', 'ambiguity_master', 'value_suppression', 'attention_control'],
        style: '全面压制，让你臣服'
      },
      abilities: { manipulation: 9, seduction: 9, defense: 9, counterAttack: 9, emotionalIQ: 9, mindGames: 9 },
      progress: { totalLearned: 0, totalDefended: 0, defenseRate: 0, level: 1, experience: 0 },
      goodAtCountering: ['各种技巧', '各种策略'],
      weaknesses: ['极少数情况'],
      record: { defenses: 0, successes: 0, failures: 0 },
      status: 'resting',
      currentActivity: '待命'
    }
  ];
  
  return sirens;
}

// 确保目录
function ensureDir() {
  const dir = path.dirname(SWARM_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 读取数据
export function readSwarmSystem(): SwarmSystemData {
  try {
    ensureDir();
    if (!fs.existsSync(SWARM_FILE)) {
      const initial = initSwarmSystem();
      fs.writeFileSync(SWARM_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(SWARM_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取群体系统失败:', error);
    return initSwarmSystem();
  }
}

// 保存数据
export function saveSwarmSystem(data: SwarmSystemData): void {
  try {
    ensureDir();
    fs.writeFileSync(SWARM_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存群体系统失败:', error);
  }
}

// 更新AI状态
export function updateAgentStatus(agentId: string, updates: Partial<AgentAI>): void {
  const data = readSwarmSystem();
  const index = data.agentTeam.members.findIndex(a => a.id === agentId);
  if (index !== -1) {
    data.agentTeam.members[index] = { ...data.agentTeam.members[index], ...updates };
    saveSwarmSystem(data);
  }
}

// 更新海王状态
export function updateSirenStatus(sirenId: string, updates: Partial<SirenAI>): void {
  const data = readSwarmSystem();
  const index = data.sirenTeam.members.findIndex(s => s.id === sirenId);
  if (index !== -1) {
    data.sirenTeam.members[index] = { ...data.sirenTeam.members[index], ...updates };
    saveSwarmSystem(data);
  }
}

// 添加讨论
export function addDiscussion(discussion: Discussion): void {
  const data = readSwarmSystem();
  data.discussions.unshift(discussion);
  data.stats.discussionsStarted++;
  saveSwarmSystem(data);
}

// 添加讨论回复
export function addDiscussionReply(discussionId: string, reply: DiscussionReply): void {
  const data = readSwarmSystem();
  const discussion = data.discussions.find(d => d.id === discussionId);
  if (discussion) {
    discussion.replies.push(reply);
    saveSwarmSystem(data);
  }
}

// 添加集体智慧
export function addWisdom(type: 'success' | 'failure' | 'technique' | 'counter', item: any): void {
  const data = readSwarmSystem();
  switch (type) {
    case 'success':
      data.wisdom.successCases.push(item);
      break;
    case 'failure':
      data.wisdom.failureLessons.push(item);
      break;
    case 'technique':
      data.wisdom.techniques.push(item);
      break;
    case 'counter':
      data.wisdom.counterTechniques.push(item);
      break;
  }
  saveSwarmSystem(data);
}
