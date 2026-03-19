import fs from 'fs';
import path from 'path';

// 学习状态
export interface LearningStatus {
  isLearning: boolean;
  currentTopic: string;
  progress: number;
  totalLearned: number;
  lastLearnTime: string;
  nextTopics: string[];
  learningHistory: LearningRecord[];
  knowledgeGraph: KnowledgeNode[];
  practiceModel: PracticeModel;
  stats: {
    totalSessions: number;
    totalTopicsLearned: number;
    averageScore: number;
    lastSessionTime: string;
  };
}

export interface LearningRecord {
  topic: string;
  timestamp: string;
  success: boolean;
  category: string;
  relatedTopics: string[];
}

export interface KnowledgeNode {
  id: string;
  topic: string;
  category: string;
  level: number; // 掌握程度 1-10
  connections: string[]; // 关联主题
  practiceCount: number;
  lastPracticed?: string;
}

export interface PracticeModel {
  stages: PracticeStage[];
  currentStage: string;
  completedExercises: number;
  totalExercises: number;
}

export interface PracticeStage {
  id: string;
  name: string;
  description: string;
  skills: string[];
  exercises: Exercise[];
  completed: boolean;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  score?: number;
}

// 学习状态文件路径
const STATUS_FILE = path.join(process.cwd(), 'data', 'learning-status.json');

// 初始实践模型
const INITIAL_PRACTICE_MODEL: PracticeModel = {
  stages: [
    {
      id: 'stage_1',
      name: '基础认知',
      description: '了解恋爱心理学基础概念',
      skills: ['吸引力原理', '男女思维差异', '第一印象'],
      exercises: [
        { id: 'ex_1_1', title: '理解吸引力开关', description: '学习什么是吸引力开关', completed: false },
        { id: 'ex_1_2', title: '分析男女沟通差异', description: '了解男女在沟通上的不同', completed: false }
      ],
      completed: false
    },
    {
      id: 'stage_2',
      name: '聊天技巧',
      description: '掌握与异性沟通的核心技巧',
      skills: ['开场白', '话题延续', '情绪共鸣', '幽默感'],
      exercises: [
        { id: 'ex_2_1', title: '练习5种开场白', description: '掌握不同场景的开场白', completed: false },
        { id: 'ex_2_2', title: '话题转换练习', description: '学会自然转换话题', completed: false },
        { id: 'ex_2_3', title: '情绪价值提供', description: '学会提供情绪价值', completed: false }
      ],
      completed: false
    },
    {
      id: 'stage_3',
      name: '约会实战',
      description: '约会场景的实战技巧',
      skills: ['约会邀约', '约会地点选择', '约会互动', '肢体接触'],
      exercises: [
        { id: 'ex_3_1', title: '邀约话术练习', description: '学会自然邀约', completed: false },
        { id: 'ex_3_2', title: '约会流程设计', description: '规划完整约会流程', completed: false }
      ],
      completed: false
    },
    {
      id: 'stage_4',
      name: '关系推进',
      description: '从认识到确立关系',
      skills: ['表白时机', '关系升级', '长期维护'],
      exercises: [
        { id: 'ex_4_1', title: '判断表白时机', description: '学会识别正确时机', completed: false },
        { id: 'ex_4_2', title: '关系维护策略', description: '长期关系的维护方法', completed: false }
      ],
      completed: false
    }
  ],
  currentStage: 'stage_1',
  completedExercises: 0,
  totalExercises: 9
};

// 初始学习状态
function initLearningStatus(): LearningStatus {
  return {
    isLearning: false,
    currentTopic: '',
    progress: 0,
    totalLearned: 0,
    lastLearnTime: '',
    nextTopics: [],
    learningHistory: [],
    knowledgeGraph: [],
    practiceModel: INITIAL_PRACTICE_MODEL,
    stats: {
      totalSessions: 0,
      totalTopicsLearned: 0,
      averageScore: 0,
      lastSessionTime: ''
    }
  };
}

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(STATUS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取学习状态
export function readLearningStatus(): LearningStatus {
  try {
    ensureDataDir();
    if (!fs.existsSync(STATUS_FILE)) {
      const initial = initLearningStatus();
      fs.writeFileSync(STATUS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(STATUS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取学习状态失败:', error);
    return initLearningStatus();
  }
}

// 保存学习状态
export function saveLearningStatus(status: LearningStatus): void {
  try {
    ensureDataDir();
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存学习状态失败:', error);
  }
}

// 更新学习状态
export function updateLearningStatus(updates: Partial<LearningStatus>): LearningStatus {
  const status = readLearningStatus();
  const newStatus = { ...status, ...updates };
  saveLearningStatus(newStatus);
  return newStatus;
}

// 添加学习记录
export function addLearningRecord(record: LearningRecord): void {
  const status = readLearningStatus();
  status.learningHistory.unshift(record);
  status.totalLearned++;
  status.lastLearnTime = record.timestamp;
  
  // 更新知识图谱
  updateKnowledgeGraph(record);
  
  // 更新统计
  status.stats.totalTopicsLearned++;
  status.stats.lastSessionTime = record.timestamp;
  
  saveLearningStatus(status);
}

// 更新知识图谱
function updateKnowledgeGraph(record: LearningRecord): void {
  const status = readLearningStatus();
  
  // 查找或创建节点
  let node = status.knowledgeGraph.find(n => n.topic === record.topic);
  
  if (!node) {
    node = {
      id: `node_${Date.now()}`,
      topic: record.topic,
      category: record.category,
      level: 1,
      connections: [],
      practiceCount: 0
    };
    status.knowledgeGraph.push(node);
  } else {
    node.level = Math.min(10, node.level + 1);
  }
  
  // 添加关联
  record.relatedTopics.forEach(related => {
    if (!node!.connections.includes(related)) {
      node!.connections.push(related);
    }
  });
  
  saveLearningStatus(status);
}

// 获取下一个学习主题
export function getNextTopics(): string[] {
  const allTopics = [
    // 基础理论
    '吸引力开关原理', '进化心理学与择偶', '社会认同理论', '互惠原则',
    // 聊天技巧
    '开放式提问技巧', '冷读术进阶', '推拉技巧详解', '幽默感培养',
    '情绪价值提供', '故事讲述技巧', '话题转换艺术',
    // 约会技巧
    '约会地点选择策略', '约会流程设计', '肢体语言信号', 'Kino进阶技巧',
    '约会中的测试与应对', '约会氛围营造',
    // 心理战术
    '稀缺性原理应用', '预选效应', '社交认证建立', '框架控制',
    '否定技巧', '挑战与奖励机制',
    // 关系管理
    '表白时机判断', '关系升级节奏', '长期关系维护', '冲突处理',
    // 进阶主题
    'NLP语言模式', '催眠式沟通', '心理暗示技巧', '影响力六大原则',
    '马斯洛需求层次应用', '依恋类型识别',
    // 实战场景
    '街头搭讪流程', '夜店社交技巧', '职场恋爱', '网恋奔现',
    '异地恋维护', '相亲技巧'
  ];
  
  const status = readLearningStatus();
  const learnedTopics = status.learningHistory.map(h => h.topic);
  
  // 过滤未学习的主题
  const unlearned = allTopics.filter(t => !learnedTopics.includes(t));
  
  // 如果都学过了，返回进阶主题
  if (unlearned.length === 0) {
    return [
      '高级吸引力建立', '社交圈建设', '个人品牌打造',
      '情商提升训练', '领导力与魅力', '深度心理学应用'
    ];
  }
  
  return unlearned.slice(0, 10);
}

// 更新练习进度
export function updatePracticeProgress(exerciseId: string, score: number): void {
  const status = readLearningStatus();
  
  for (const stage of status.practiceModel.stages) {
    const exercise = stage.exercises.find(e => e.id === exerciseId);
    if (exercise) {
      exercise.completed = true;
      exercise.score = score;
      status.practiceModel.completedExercises++;
      
      // 检查阶段是否完成
      if (stage.exercises.every(e => e.completed)) {
        stage.completed = true;
        // 移动到下一阶段
        const nextStage = status.practiceModel.stages.find(s => !s.completed && s.id !== stage.id);
        if (nextStage) {
          status.practiceModel.currentStage = nextStage.id;
        }
      }
      
      break;
    }
  }
  
  saveLearningStatus(status);
}
