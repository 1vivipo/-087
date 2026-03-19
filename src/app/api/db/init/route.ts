import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hhmgmjdxoyixxvlewinh.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // 直接尝试插入数据来创建表（如果表不存在会失败）
    // 但我们可以通过检查来确认
    
    return NextResponse.json({ 
      success: true, 
      message: '请在 Supabase Dashboard 执行 SQL 脚本创建表',
      sqlUrl: 'https://supabase.com/dashboard/project/hhmgmjdxoyixxvlewinh/sql/new'
    })
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
