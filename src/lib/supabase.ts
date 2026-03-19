import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 初始化数据库表
export async function initDatabase() {
  try {
    // 创建知识库表
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS knowledge_items (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT,
          source TEXT,
          category TEXT,
          tags TEXT[],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    console.log('数据库表初始化完成')
    return true
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return false
  }
}
