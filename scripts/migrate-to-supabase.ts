import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://hhmgmjdxoyixxvlewinh.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function migrateKnowledge() {
  console.log('迁移知识库...')
  
  const data = JSON.parse(fs.readFileSync('./data/knowledge-base.json', 'utf-8'))
  const items = data.items || []
  
  console.log(`共 ${items.length} 条知识`)
  
  // 批量插入
  const batchSize = 100
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize).map((item: any) => ({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags,
      source: item.source
    }))
    
    const { error } = await supabase.from('knowledge').insert(batch)
    if (error) {
      console.error(`批次 ${i} 失败:`, error.message)
    } else {
      console.log(`已迁移 ${Math.min(i + batchSize, items.length)}/${items.length}`)
    }
  }
  
  console.log('知识库迁移完成')
}

async function migrateBooks() {
  console.log('迁移书籍...')
  
  const indexData = JSON.parse(fs.readFileSync('./data/books/index.json', 'utf-8'))
  const books = indexData.books || []
  
  for (const book of books) {
    // 读取书籍详情
    const bookFile = `./data/books/${book.id}.json`
    if (fs.existsSync(bookFile)) {
      const bookData = JSON.parse(fs.readFileSync(bookFile, 'utf-8'))
      
      const { error } = await supabase.from('books').insert({
        id: bookData.id,
        title: bookData.title,
        author: bookData.author,
        author_id: bookData.authorId,
        author_type: bookData.authorType,
        category: bookData.category,
        word_count: bookData.content?.reduce((sum: number, c: any) => sum + c.wordCount, 0) || 0,
        chapters_written: bookData.content?.length || 0,
        status: bookData.status,
        progress: bookData.progress,
        outline: bookData.outline,
        content: bookData.content
      })
      
      if (error) {
        console.error(`书籍 ${bookData.title} 失败:`, error.message)
      } else {
        console.log(`已迁移: ${bookData.title}`)
      }
    }
  }
  
  console.log('书籍迁移完成')
}

async function main() {
  await migrateKnowledge()
  await migrateBooks()
  console.log('全部迁移完成!')
}

main().catch(console.error)
