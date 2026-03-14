-- 恋爱追女生智能体 - 数据库表结构
-- 请在 Supabase SQL Editor 中执行

-- 1. 知识库表
CREATE TABLE IF NOT EXISTS knowledge_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    source TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 书籍表
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    author_id TEXT,
    author_type TEXT,
    category TEXT,
    target_audience TEXT,
    word_count INTEGER DEFAULT 0,
    chapters_written INTEGER DEFAULT 0,
    status TEXT DEFAULT 'planning',
    progress REAL DEFAULT 0,
    outline JSONB DEFAULT '[]',
    content JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. 训练记录表
CREATE TABLE IF NOT EXISTS training_records (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 对抗记录表
CREATE TABLE IF NOT EXISTS battle_records (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    girl_id TEXT,
    winner TEXT,
    difficulty INTEGER DEFAULT 5,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI角色表
CREATE TABLE IF NOT EXISTS ai_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    skills JSONB DEFAULT '{}',
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 女生角色表
CREATE TABLE IF NOT EXISTS girls (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    difficulty INTEGER DEFAULT 5,
    traits JSONB DEFAULT '{}',
    conquered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_items(category);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_battle_winner ON battle_records(winner);

-- 启用 Row Level Security (可选)
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE girls ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略 (service_role 可以绕过)
CREATE POLICY "Allow all for service_role" ON knowledge_items FOR ALL USING (true);
CREATE POLICY "Allow all for service_role" ON books FOR ALL USING (true);
CREATE POLICY "Allow all for service_role" ON training_records FOR ALL USING (true);
CREATE POLICY "Allow all for service_role" ON battle_records FOR ALL USING (true);
CREATE POLICY "Allow all for service_role" ON ai_agents FOR ALL USING (true);
CREATE POLICY "Allow all for service_role" ON girls FOR ALL USING (true);
