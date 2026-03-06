import { NextResponse } from 'next/server';

// 启动时自动开始学习
let hasStartedAutoLearn = false;

export async function GET() {
  // 首次访问时自动启动学习
  if (!hasStartedAutoLearn) {
    hasStartedAutoLearn = true;
    
    // 异步启动学习，不阻塞响应
    setTimeout(async () => {
      try {
        await fetch('http://localhost:3000/api/auto-learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        });
        console.log('[系统] 自动学习已启动');
      } catch (error) {
        console.log('[系统] 自动学习启动失败');
      }
    }, 5000);
  }

  return NextResponse.json({
    success: true,
    message: '恋爱追女生智能体已就绪'
  });
}
