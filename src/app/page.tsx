'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, Play, Pause, Brain, Sword, MessageSquare, FileText,
  TrendingUp, Target, Users, Trophy, Flame, Crown, Skull,
  Eye, Settings, BarChart3, Activity, Clock, CheckCircle,
  AlertTriangle, Lightbulb, RefreshCw, Download, BookOpen,
  Book, FileDown, FolderOpen
} from 'lucide-react'

export default function LoveAgent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  
  // 状态
  const [trainingStatus, setTrainingStatus] = useState<any>(null)
  const [swarmStatus, setSwarmStatus] = useState<any>(null)
  const [books, setBooks] = useState<any[]>([])
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([])
  
  // 加载数据
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const trainingRes = await fetch('/api/autonomous')
      const trainingData = await trainingRes.json()
      if (trainingData.success) setTrainingStatus(trainingData.status)
      
      const swarmRes = await fetch('/api/swarm')
      const swarmData = await swarmRes.json()
      if (swarmData.success) setSwarmStatus(swarmData.status)
      
      // 加载书籍
      const booksRes = await fetch('/api/writing?action=list')
      const booksData = await booksRes.json()
      if (booksData.success) setBooks(booksData.books || [])
      
      // 加载知识库
      const knowledgeRes = await fetch('/api/knowledge')
      const knowledgeData = await knowledgeRes.json()
      if (knowledgeData.success) {
        setKnowledgeItems(knowledgeData.knowledgeBase?.items?.slice(0, 50) || [])
      }
    } catch (error) {
      console.error('加载失败:', error)
    }
  }

  // 启动/停止自主训练
  const toggleTraining = async () => {
    setIsLoading(true)
    try {
      const action = trainingStatus?.isRunning ? 'stop' : 'start'
      await fetch('/api/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      loadData()
    } finally {
      setIsLoading(false)
    }
  }

  // 下载书籍
  const downloadBook = async (bookId: string, title: string) => {
    try {
      const res = await fetch(`/api/writing?action=download&id=${bookId}`)
      const text = await res.text()
      
      const blob = new Blob([text], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  // 查看书籍详情
  const viewBook = async (bookId: string) => {
    try {
      const res = await fetch(`/api/writing?action=detail&id=${bookId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedBook(data.book)
      }
    } catch (error) {
      console.error('加载失败:', error)
    }
  }

  // 计算进度百分比
  const getProgress = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* 头部 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-yellow-400" />
            恋爱追女生智能体
          </h1>
          <p className="text-gray-400">自主训练 · 千万级数据 · 持续进化</p>
          
          {/* 状态指示 */}
          <div className="flex items-center justify-center gap-4 mt-3">
            {trainingStatus?.isRunning && (
              <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-green-400 text-xs">自主训练中</span>
              </div>
            )}
            {trainingStatus?.currentPhase && (
              <Badge className="bg-purple-600">{trainingStatus.currentPhase}</Badge>
            )}
          </div>
        </div>

        {/* 核心统计 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{trainingStatus?.total?.knowledgeBase || 0}</div>
              <div className="text-xs text-gray-400">知识库</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-pink-400">{trainingStatus?.total?.totalBattles || 0}</div>
              <div className="text-xs text-gray-400">总对抗</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{trainingStatus?.total?.totalWins || 0}</div>
              <div className="text-xs text-gray-400">胜利</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{trainingStatus?.total?.girlsConquered || 0}</div>
              <div className="text-xs text-gray-400">已攻略</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{trainingStatus?.total?.averageSuccessRate || '0%'}</div>
              <div className="text-xs text-gray-400">成功率</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-orange-400">{books.length}</div>
              <div className="text-xs text-gray-400">书籍</div>
            </CardContent>
          </Card>
        </div>

        {/* 主内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 bg-white/10 backdrop-blur mb-4">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600">
              <Activity className="w-4 h-4 mr-1" />控制台
            </TabsTrigger>
            <TabsTrigger value="books" className="data-[state=active]:bg-purple-600">
              <BookOpen className="w-4 h-4 mr-1" />书籍
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-purple-600">
              <Brain className="w-4 h-4 mr-1" />知识库
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-1" />团队
            </TabsTrigger>
            <TabsTrigger value="supervisors" className="data-[state=active]:bg-purple-600">
              <Eye className="w-4 h-4 mr-1" />监督官
            </TabsTrigger>
            <TabsTrigger value="decisions" className="data-[state=active]:bg-purple-600">
              <Lightbulb className="w-4 h-4 mr-1" />决策
            </TabsTrigger>
          </TabsList>

          {/* 控制台 */}
          <TabsContent value="dashboard">
            <div className="grid md:grid-cols-2 gap-4">
              {/* 控制面板 */}
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    自主训练控制
                  </CardTitle>
                  <CardDescription>完全自主，无需人工干预</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={toggleTraining}
                    disabled={isLoading}
                    className={`w-full ${trainingStatus?.isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {trainingStatus?.isRunning ? (
                      <><Pause className="w-4 h-4 mr-2" />停止训练</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" />启动训练</>
                    )}
                  </Button>
                  
                  <div className="text-xs text-gray-400">
                    目标：每日千万级训练量
                  </div>
                </CardContent>
              </Card>

              {/* 实时状态 */}
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    实时状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">知识库</span>
                      <span className="text-white font-bold">{trainingStatus?.total?.knowledgeBase || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">总对抗</span>
                      <span className="text-white font-bold">{trainingStatus?.total?.totalBattles || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">成功率</span>
                      <span className="text-green-400 font-bold">{trainingStatus?.total?.averageSuccessRate || '0%'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">已攻略女生</span>
                      <span className="text-yellow-400 font-bold">{trainingStatus?.total?.girlsConquered || 0}/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 训练目标 */}
            <Card className="bg-white/10 backdrop-blur border-white/20 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">训练目标（每日）</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">知识学习</div>
                    <div className="text-xl font-bold text-blue-400">
                      {trainingStatus?.config?.dailyTargets?.knowledgeToLearn?.toLocaleString() || '10,000'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">对抗训练</div>
                    <div className="text-xl font-bold text-pink-400">
                      {trainingStatus?.config?.dailyTargets?.battlesToFight?.toLocaleString() || '100,000'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">讨论次数</div>
                    <div className="text-xl font-bold text-purple-400">
                      {trainingStatus?.config?.dailyTargets?.discussionsToHold?.toLocaleString() || '5,000'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">书籍数量</div>
                    <div className="text-xl font-bold text-green-400">{books.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 书籍 */}
          <TabsContent value="books">
            <div className="grid md:grid-cols-3 gap-4">
              {/* 书籍列表 */}
              <div className="md:col-span-1">
                <Card className="bg-white/10 backdrop-blur border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Book className="w-5 h-5 text-yellow-400" />
                      AI书籍 ({books.length}本)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {books.map((book) => (
                          <div 
                            key={book.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedBook?.id === book.id 
                                ? 'bg-purple-600/50 border border-purple-400' 
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                            onClick={() => viewBook(book.id)}
                          >
                            <div className="font-medium text-white text-sm truncate">{book.title}</div>
                            <div className="text-xs text-gray-400 mt-1">{book.author}</div>
                            <div className="flex items-center justify-between mt-2">
                              <Badge className="text-xs" variant="outline">
                                {book.progress}
                              </Badge>
                              <span className="text-xs text-gray-400">{book.wordCount}字</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* 书籍详情 */}
              <div className="md:col-span-2">
                {selectedBook ? (
                  <Card className="bg-white/10 backdrop-blur border-white/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{selectedBook.title}</CardTitle>
                          <CardDescription className="mt-1">
                            作者: {selectedBook.author} | 分类: {selectedBook.category}
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={() => downloadBook(selectedBook.id, selectedBook.title)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          下载
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">写作进度</span>
                          <span className="text-white">{selectedBook.chaptersWritten}/{selectedBook.outline?.length || 12}章</span>
                        </div>
                        <Progress value={parseFloat(selectedBook.progress) || 0} className="h-2" />
                      </div>
                      
                      <ScrollArea className="h-[400px]">
                        {selectedBook.content?.map((chapter: any) => (
                          <div key={chapter.number} className="mb-4 p-3 bg-white/5 rounded-lg">
                            <h4 className="font-medium text-white mb-2">{chapter.title}</h4>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{chapter.content}</p>
                          </div>
                        ))}
                        {(!selectedBook.content || selectedBook.content.length === 0) && (
                          <div className="text-center text-gray-400 py-8">
                            暂无内容，正在写作中...
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/10 backdrop-blur border-white/20 h-full flex items-center justify-center">
                    <CardContent className="text-center">
                      <FolderOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">选择一本书籍查看详情</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 知识库 */}
          <TabsContent value="knowledge">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  知识库 ({knowledgeItems.length}条)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {knowledgeItems.map((item, index) => (
                      <div key={item.id || index} className="p-3 bg-white/5 rounded-lg">
                        <div className="font-medium text-white text-sm">{item.title}</div>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{item.content?.substring(0, 150)}...</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="text-xs" variant="outline">{item.category}</Badge>
                          {item.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} className="text-xs bg-purple-600/50">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 团队 */}
          <TabsContent value="team">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">我方AI团队</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {(swarmStatus?.agentTeam?.members || []).map((agent: any) => (
                        <div key={agent.id} className="p-2 bg-white/5 rounded flex justify-between items-center">
                          <div>
                            <span className="mr-2">{agent.avatar}</span>
                            <span className="text-white text-sm">{agent.name}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Lv.{agent.progress?.level} | {agent.record?.wins}胜{agent.record?.losses}负
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-900/30 to-purple-900/30 backdrop-blur border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-white">敌方海王团队</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {(swarmStatus?.sirenTeam?.members || []).map((siren: any) => (
                        <div key={siren.id} className="p-2 bg-white/5 rounded flex justify-between items-center">
                          <div>
                            <span className="mr-2">{siren.avatar}</span>
                            <span className="text-white text-sm">{siren.name}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Lv.{siren.progress?.level} | {siren.record?.successes}胜{siren.record?.failures}负
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 监督官 */}
          <TabsContent value="supervisors">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  监督智能体团队
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {(trainingStatus?.supervisors || []).map((supervisor: any) => (
                    <div key={supervisor.name} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-white">{supervisor.name}</h4>
                          <p className="text-xs text-gray-400">{supervisor.role}</p>
                        </div>
                        <Badge className="bg-blue-600">{supervisor.currentTask}</Badge>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-400">决策次数</span>
                        <span className="text-white">{supervisor.decisions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">准确率</span>
                        <span className="text-green-400">{supervisor.accuracy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 决策 */}
          <TabsContent value="decisions">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">自主决策记录</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {(trainingStatus?.recentDecisions || []).length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      暂无决策记录
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(trainingStatus?.recentDecisions || []).map((decision: any) => (
                        <div key={decision.id} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <Badge className="bg-purple-600">{decision.decisionMaker}</Badge>
                            <span className="text-xs text-gray-400">{decision.timestamp}</span>
                          </div>
                          <p className="text-sm text-white">{decision.decision?.action}</p>
                          <p className="text-xs text-gray-400 mt-1">原因: {decision.decision?.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
