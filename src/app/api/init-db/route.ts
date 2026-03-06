import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'Supabase 配置缺失' 
    }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const results: string[] = []

  try {
    // 1. 创建知识库表
    const { error: error1 } = await supabase.from('knowledge_items').select('id').limit(1)
    if (error1?.code === 'PGRST205') {
      // 表不存在，需要创建
      results.push('knowledge_items 表需要创建')
    } else {
      results.push('knowledge_items 表已存在')
    }

    // 2. 创建书籍表
    const { error: error2 } = await supabase.from('books').select('id').limit(1)
    if (error2?.code === 'PGRST205') {
      results.push('books 表需要创建')
    } else {
      results.push('books 表已存在')
    }

    // 3. 创建训练记录表
    const { error: error3 } = await supabase.from('training_records').select('id').limit(1)
    if (error3?.code === 'PGRST205') {
      results.push('training_records 表需要创建')
    } else {
      results.push('training_records 表已存在')
    }

    return NextResponse.json({
      success: true,
      message: '数据库检查完成',
      results,
      instructions: '请在 Supabase 控制台执行以下 SQL 创建表'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
