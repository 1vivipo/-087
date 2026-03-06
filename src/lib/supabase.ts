import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhmgmjdxoyixxvlewinh.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 知识库操作
export async function getKnowledge(limit = 100, offset = 0) {
  const { data, error, count } = await supabase
    .from('knowledge')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  return { items: data || [], total: count || 0 }
}

export async function addKnowledge(item: { title: string; content: string; category?: string; tags?: string[]; source?: string }) {
  const { data, error } = await supabase
    .from('knowledge')
    .insert(item)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function addKnowledgeBatch(items: Array<{ title: string; content: string; category?: string; tags?: string[]; source?: string }>) {
  const { data, error } = await supabase
    .from('knowledge')
    .insert(items)
  
  if (error) throw error
  return true
}

// 书籍操作
export async function getBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getBook(id: string) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createBook(book: any) {
  const { data, error } = await supabase
    .from('books')
    .insert(book)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateBook(id: string, updates: any) {
  const { data, error } = await supabase
    .from('books')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function addChapter(bookId: string, chapter: any) {
  const book = await getBook(bookId)
  const content = book.content || []
  content.push(chapter)
  
  return updateBook(bookId, {
    content,
    chapters_written: content.length,
    progress: (content.length / (book.outline?.length || 12)) * 100,
    status: content.length >= (book.outline?.length || 12) ? 'completed' : 'writing'
  })
}

// 女生角色操作
export async function getGirls() {
  const { data, error } = await supabase
    .from('girls')
    .select('*')
  
  if (error) throw error
  return data || []
}

export async function createGirl(girl: any) {
  const { data, error } = await supabase
    .from('girls')
    .insert(girl)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// 对抗记录操作
export async function createBattle(battle: any) {
  const { data, error } = await supabase
    .from('battles')
    .insert(battle)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// 训练记录操作
export async function recordTraining(type: string, count: number) {
  const { data, error } = await supabase
    .from('training_records')
    .insert({ type, count })
  
  if (error) throw error
  return true
}

// AI角色操作
export async function getAIAgents() {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
  
  if (error) throw error
  return data || []
}

export async function createAIAgent(agent: any) {
  const { data, error } = await supabase
    .from('ai_agents')
    .insert(agent)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateAIAgent(id: string, updates: any) {
  const { data, error } = await supabase
    .from('ai_agents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}
