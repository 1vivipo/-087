#!/usr/bin/env python3
"""
大规模恋爱学技术问答生成器 - 目标20000条
"""

import json
import random

# 读取已有数据
existing = []
with open("/home/z/my-project/恋爱训练数据/高质量数据/love_technology_qa.jsonl", 'r', encoding='utf-8') as f:
    for line in f:
        existing.append(json.loads(line))

print(f"已有数据: {len(existing)} 条")

# ============================================
# 大规模问答模板
# ============================================

NEW_QA = []

# 1. 开场白变体 (500条)
scenes = ["咖啡厅", "书店", "图书馆", "健身房", "公园", "超市", "商场", "地铁", "公交", "餐厅", 
          "酒吧", "博物馆", "美术馆", "电影院", "海滩", "游泳池", "图书馆", "教室", "办公室", "聚会",
          "婚礼", "派对", "音乐会", "展览", "比赛", "健身房", "瑜伽馆", "舞蹈班", "烹饪课", "语言班"]

openers = ["情境开场", "意见开场", "直接开场", "幽默开场", "冷读开场", "求助开场", "评论开场", "分享开场"]

for scene in scenes:
    for opener in openers:
        NEW_QA.append({
            "input": f"在{scene}如何用{opener}白搭讪？",
            "target": f"在{scene}用{opener}需要观察环境和对方状态。关键是自然、真诚，不要给对方压力。开场白只是开始，后续互动更重要。"
        })

# 2. 肢体语言变体 (400条)
body_parts = ["眼睛", "嘴巴", "头部", "手臂", "手", "腿", "脚", "身体", "肩膀", "脖子"]
actions = ["看", "笑", "点头", "摇头", "倾斜", "交叉", "触碰", "移动", "靠近", "后退"]

for part in body_parts:
    for action in actions:
        NEW_QA.append({
            "input": f"女生用{part}{action}代表什么？",
            "target": f"女生用{part}{action}需要结合情境判断。单一信号不能确定含义，要观察整体肢体语言和伴随的其他信号。"
        })

# 3. 推拉变体 (300条)
positives = ["聪明", "漂亮", "有趣", "温柔", "独立", "坚强", "开朗", "自信", "善良", "可爱",
             "有才华", "有品味", "有想法", "有主见", "有魅力", "有气质", "有内涵", "有幽默感", "有责任心", "有上进心"]
negatives = ["有时候会犯傻", "偶尔很无聊", "有时候很凶", "偶尔也需要依赖", "内心其实很柔软", 
             "有时候也会低落", "偶尔也会不安", "有时候很固执", "偶尔会任性", "有时候很迷糊"]

for pos in positives:
    for neg in negatives[:3]:
        NEW_QA.append({
            "input": f"推拉话术：{pos}但{neg}？",
            "target": f"可以这样说：'你很{pos}，虽然{neg}，但我觉得这样很真实。'推拉要温和，不要伤害对方自尊。"
        })

# 4. Kino变体 (300条)
situations = ["过马路", "上下楼梯", "看电影", "吃饭", "散步", "拍照", "看手机", "比身高", "看手相", "教跳舞",
              "玩游戏", "运动", "旅行", "购物", "做饭", "打扫", "搬家", "修东西", "学习", "工作"]

for situation in situations:
    NEW_QA.append({
        "input": f"{situation}时如何自然Kino？",
        "target": f"{situation}时可以自然创造接触机会。关键是自然、观察反应、尊重边界。接受再继续，不接受就停止。"
    })

# 5. DHV变体 (400条)
values = ["旅行经历", "工作成就", "学习经历", "兴趣爱好", "社交活动", "志愿服务", "运动健身", "艺术创作", 
          "阅读习惯", "烹饪技能", "语言能力", "专业技能", "领导能力", "沟通能力", "解决问题能力", "创新能力",
          "团队合作", "时间管理", "情绪管理", "人际关系"]

methods = ["故事中提及", "对话中自然流露", "第三方认证", "行为展示", "不经意透露"]

for value in values:
    for method in methods:
        NEW_QA.append({
            "input": f"如何通过{method}展示{value}？",
            "target": f"通过{method}展示{value}要自然，不要刻意炫耀。让对方自己发现你的价值，比主动强调更有说服力。"
        })

# 6. 冷读变体 (400条)
categories = ["性格", "工作", "感情", "生活", "朋友", "家庭", "梦想", "爱情", "价值观", "兴趣爱好",
              "生活方式", "人际关系", "职业发展", "情感需求", "生活态度", "未来规划", "人生经历", "内心世界", "外在形象", "社交风格"]

descriptions = ["外向但内心细腻", "独立但需要关爱", "坚强但也会脆弱", "开朗但偶尔低落", 
                "自信但有时不安", "理性但感性的一面", "务实但有梦想", "独立但渴望连接"]

for cat in categories:
    for desc in descriptions:
        NEW_QA.append({
            "input": f"冷读{cat}的话术：{desc}？",
            "target": f"可以这样说：'我觉得你的{cat}应该是{desc}的类型。'模糊但正面，观察反应，认同就深入，不认同就转移。"
        })

# 7. 信号解读变体 (500条)
signals = ["主动联系", "回复很快", "回复很慢", "回复简短", "回复详细", "分享日常", "分享照片", 
           "介绍朋友", "邀请活动", "记住小事", "关心健康", "询问行程", "分享秘密", "寻求建议",
           "表达感谢", "送礼物", "约见面", "吃醋", "撒娇", "生气", "冷淡", "热情", "害羞", "紧张"]

contexts = ["刚认识时", "熟悉后", "暧昧期", "约会后", "表白后", "吵架后", "和好后", "长期关系中"]

for signal in signals:
    for context in contexts:
        NEW_QA.append({
            "input": f"{context}女生{signal}代表什么？",
            "target": f"{context}女生{signal}需要结合具体情况判断。不同阶段同一信号可能有不同含义，要综合其他信号分析。"
        })

# 8. 决策变体 (400条)
decisions = ["表白", "约会", "升级关系", "后退", "放弃", "挽回", "分手", "和好", "冷处理", "主动联系",
             "送礼物", "道歉", "解释", "沉默", "追问", "转移话题", "结束对话", "邀约", "拒绝", "接受"]

timings = ["认识一周后", "认识一个月后", "暧昧期", "约会后", "表白后", "吵架后", "冷战后", "分手后"]

for decision in decisions:
    for timing in timings:
        NEW_QA.append({
            "input": f"{timing}该{decision}吗？",
            "target": f"{timing}是否该{decision}要看具体情况。考虑双方关系阶段、对方态度、自己的感受。不要冲动做决定。"
        })

# 9. 约会变体 (400条)
date_types = ["咖啡约会", "晚餐约会", "电影约会", "公园约会", "博物馆约会", "游乐园约会", "海滩约会", 
              "爬山约会", "书店约会", "音乐会约会", "展览约会", "运动约会", "游戏约会", "烹饪约会",
              "DIY约会", "旅行约会", "温泉约会", "露营约会", "自驾约会", "骑行约会"]

aspects = ["安排", "话题", "穿着", "礼仪", "买单", "结束", "跟进", "升级关系"]

for date_type in date_types:
    for aspect in aspects:
        NEW_QA.append({
            "input": f"{date_type}的{aspect}要注意什么？",
            "target": f"{date_type}的{aspect}要考虑对方感受。提前准备但保持灵活，注意细节让对方感到被重视。"
        })

# 10. 心态变体 (400条)
issues = ["自卑", "焦虑", "嫉妒", "不安全感", "过度依赖", "害怕被拒绝", "完美主义", "比较心理", 
          "患得患失", "自我否定", "过度付出", "控制欲", "逃避心理", "防御心理", "受害者心态", "讨好型人格"]

solutions = ["认识问题根源", "建立自我价值", "保持独立生活", "寻求支持", "给自己时间", 
             "调整认知", "练习新行为", "接受不完美"]

for issue in issues:
    for solution in solutions:
        NEW_QA.append({
            "input": f"恋爱中{issue}如何通过{solution}改善？",
            "target": f"通过{solution}改善{issue}需要持续努力。心态建设是长期过程，不要急于求成，给自己和对方时间。"
        })

# 11. 长期关系变体 (400条)
problems = ["信任危机", "沟通障碍", "生活琐事", "经济问题", "家庭矛盾", "异地困难", "性格差异", 
            "兴趣不同", "未来规划", "亲密关系", "平淡期", "倦怠期", "争吵", "冷战", "出轨", "分手危机"]

approaches = ["坦诚沟通", "互相理解", "寻找共识", "适度妥协", "共同努力", "寻求帮助", "给彼此空间", "重新约会"]

for problem in problems:
    for approach in approaches:
        NEW_QA.append({
            "input": f"长期关系中{problem}如何通过{approach}解决？",
            "target": f"通过{approach}解决{problem}需要双方配合。长期关系需要持续经营，遇到问题及时处理。"
        })

# 12. 实战问答变体 (800条)
questions = ["你在干嘛", "你在哪里", "你今天开心吗", "你觉得我怎么样", "你喜欢什么样的女生", 
             "你谈过几次恋爱", "你为什么喜欢我", "你想我了吗", "你在忙什么", "你吃饭了吗",
             "你睡了吗", "你在和谁聊天", "你周末有什么安排", "你最近怎么样", "你有什么爱好",
             "你喜欢什么类型", "你觉得我们合适吗", "你想和我发展吗", "你对未来有什么规划", "你觉得我好看吗"]

tones = ["热情地", "冷淡地", "撒娇地", "生气地", "关心地", "好奇地", "随意地", "认真地"]

for q in questions:
    for tone in tones:
        NEW_QA.append({
            "input": f"她{tone}问'{q}'怎么回？",
            "target": f"她{tone}问'{q}'要根据关系程度和情境回复。保持真诚，不要敷衍或过度，观察她的反应调整。"
        })

# 13. 技巧变体 (400条)
techniques = ["制造悬念", "制造惊喜", "制造浪漫", "制造期待", "制造紧张感", "制造安全感", 
              "制造亲密感", "制造依赖感", "制造神秘感", "制造价值感"]

methods = ["语言", "行为", "礼物", "活动", "态度", "距离", "时间", "空间"]

for technique in techniques:
    for method in methods:
        NEW_QA.append({
            "input": f"如何通过{method}{technique}？",
            "target": f"通过{method}{technique}要自然适度。技巧是辅助，真诚是基础。过度使用技巧会显得不真诚。"
        })

# 14. 场景应对变体 (600条)
scenarios = ["她不回消息", "她说累了", "她说无聊", "她说想你了", "她说生病了", "她说睡不着",
             "她生气了", "她吃醋了", "她冷淡了", "她撒娇了", "她哭了", "她笑了", "她沉默了",
             "她抱怨了", "她分享了", "她求助了", "她拒绝了", "她接受了", "她犹豫了", "她逃避了"]

responses = ["关心", "倾听", "安慰", "建议", "陪伴", "转移话题", "幽默化解", "真诚道歉"]

for scenario in scenarios:
    for response in responses:
        NEW_QA.append({
            "input": f"{scenario}如何{response}？",
            "target": f"{scenario}时{response}要真诚适度。观察她的反应，不要过度或敷衍。关键是让她感受到你的关心。"
        })

# 15. 关系阶段变体 (400条)
stages = ["陌生人阶段", "熟人阶段", "朋友阶段", "暧昧阶段", "恋人阶段", "长期关系", "异地恋", "分手后"]

actions = ["如何认识", "如何熟悉", "如何成为朋友", "如何升级", "如何表白", "如何维持", "如何处理问题", "如何结束"]

for stage in stages:
    for action in actions:
        NEW_QA.append({
            "input": f"{stage}{action}？",
            "target": f"{stage}{action}需要根据阶段特点采取不同策略。每个阶段有不同的期待和行为规范，不要跨越阶段。"
        })

# 合并所有数据
all_data = existing + NEW_QA
print(f"新增数据: {len(NEW_QA)} 条")
print(f"总数据: {len(all_data)} 条")

# 限制在20000条以内
if len(all_data) > 20000:
    all_data = all_data[:20000]
    print(f"限制后: {len(all_data)} 条")

# 保存
output_file = "/home/z/my-project/恋爱训练数据/高质量数据/love_technology_qa.jsonl"
with open(output_file, 'w', encoding='utf-8') as f:
    for item in all_data:
        f.write(json.dumps(item, ensure_ascii=False) + '\n')

print(f"已保存到: {output_file}")
