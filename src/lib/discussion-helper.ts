// 发起讨论 - 基于真实恋爱问题
async function initiateDiscussion(agent: AgentAI) {
  try {
    const zai = await ZAI.create();
    
    console.log(`[讨论] ${agent.name} 发起讨论`);
    
    updateAgentStatus(agent.id, { status: 'discussing', currentActivity: '发起讨论' });
    
    // 真实的恋爱问题场景
    const realScenarios = [
      '和女生聊天时不知道怎么延续话题',
      '女生回复很冷淡，不知道怎么破冰',
      '不知道什么时候该推进关系',
      '女生说"你是个好人"，不知道怎么应对',
      '约会时不知道聊什么话题',
      '女生忽冷忽热，不知道怎么处理',
      '不知道怎么判断女生是否对自己有好感',
      '表白被拒绝了，不知道下一步怎么办',
      '女生总是不主动找我聊天',
      '不知道怎么在微信上制造暧昧气氛'
    ];
    
    const randomScenario = realScenarios[Math.floor(Math.random() * realScenarios.length)];
    
    const completion = await zai.chat.completions.create({
      messages: [{
        role: 'user',
        content: `你是${agent.name}，一个正在学习恋爱技巧的男生。
你的专长是: ${agent.specialty.primary}

你在练习恋爱技巧时遇到了这个问题:
"${randomScenario}"

请详细描述你的困惑，向团队求助。

要求：
1. 问题描述要真实、接地气
2. 说明你尝试过什么方法
3. 说明为什么这些方法没用

返回JSON格式:
{
  "topic": "讨论主题（简洁明了）",
  "situation": "具体情况描述（真实场景）",
  "failedAttempts": ["尝试过的方法1", "尝试过的方法2"],
  "stuckPoint": "卡住的地方"
}`
      }],
      temperature: 0.8
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const problem = JSON.parse(jsonMatch[0]);
      
      const discussion = {
        id: `disc_${Date.now()}`,
        timestamp: new Date().toISOString(),
        initiator: {
          type: 'agent' as const,
          id: agent.id,
          name: agent.name
        },
        topic: problem.topic,
        problem: {
          targetId: '',
          targetName: '女生',
          targetType: '高难度',
          difficulty: 8,
          situation: problem.situation,
          failedAttempts: problem.failedAttempts,
          stuckPoint: problem.stuckPoint
        },
        replies: [],
        result: 'ongoing' as const
      };
      
      const data = readSwarmSystem();
      data.discussions.unshift(discussion as any);
      data.stats.discussionsStarted++;
      saveSwarmSystem(data);
      
      // 让其他AI回复
      await generateTeamReplies(discussion as any);
    }

  } catch (error) {
    console.error(`[讨论失败]:`, error);
  }
}

// 生成团队回复 - 基于真实恋爱建议
async function generateTeamReplies(discussion: any) {
  const zai = await ZAI.create();
  const data = readSwarmSystem();
  
  const otherAgents = data.agentTeam.members
    .filter(a => a.id !== discussion.initiator.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  for (const agent of otherAgents) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [{
          role: 'user',
          content: `你是${agent.name}，一个正在学习恋爱技巧的男生。
你的专长是: ${agent.specialty.primary}

${discussion.initiator.name}遇到了这个问题:
主题: ${discussion.topic}
情况: ${discussion.problem.situation}
尝试过: ${discussion.problem.failedAttempts.join('、')}
卡住点: ${discussion.problem.stuckPoint}

请给出你的建议。要求：
1. 建议要具体、可操作，是真实的聊天技巧
2. 可以举例说明具体该怎么说
3. 结合你的专长给出建议
4. 不要有任何科幻或奇怪的内容

返回JSON:
{
  "content": "回复内容（真实的建议）",
  "suggestedStrategy": {
    "name": "策略名称",
    "description": "策略描述",
    "steps": ["具体步骤1", "具体步骤2"]
  }
}`
        }],
        temperature: 0.8
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const reply = JSON.parse(jsonMatch[0]);
        
        const discussionReply = {
          id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          responder: {
            type: 'agent',
            id: agent.id,
            name: agent.name,
            specialty: agent.specialty.primary
          },
          content: reply.content,
          suggestedStrategy: reply.suggestedStrategy,
          ratings: [],
          averageRating: 0
        };
        
        const data = readSwarmSystem();
        const disc = data.discussions.find(d => d.id === discussion.id);
        if (disc) {
          disc.replies.push(discussionReply as any);
          saveSwarmSystem(data);
        }
      }
      
    } catch (error) {
      console.error(`[回复失败] ${agent.name}:`, error);
    }
  }
}
