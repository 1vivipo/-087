-- 知识库表
CREATE TABLE IF NOT EXISTS knowledge (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 书籍表
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
    outline JSONB,
    content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 章节表
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    book_id TEXT REFERENCES books(id),
    number INTEGER,
    title TEXT,
    content TEXT,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 训练记录表
CREATE TABLE IF NOT EXISTS training_records (
    id SERIAL PRIMARY KEY,
    type TEXT,
    count INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 对抗记录表
CREATE TABLE IF NOT EXISTS battles (
    id SERIAL PRIMARY KEY,
    girl_id TEXT,
    girl_name TEXT,
    difficulty INTEGER,
    winner TEXT,
    rounds JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 女生角色表
CREATE TABLE IF NOT EXISTS girls (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    difficulty INTEGER,
    personality JSONB,
    conquered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI角色表
CREATE TABLE IF NOT EXISTS ai_agents (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    skills JSONB,
    stats JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge(created_at);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at);

-- 启用行级安全策略 (RLS)
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE girls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略 (开发环境)
CREATE POLICY "Allow all for service role" ON knowledge FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON books FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON chapters FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON training_records FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON battles FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON girls FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON ai_agents FOR ALL USING (true);
