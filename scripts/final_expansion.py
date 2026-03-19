#!/usr/bin/env python3
"""
最终扩充 - 目标20000条
"""

import json
import random

# 读取已有数据
existing = []
with open("/home/z/my-project/恋爱训练数据/高质量数据/love_technology_qa.jsonl", 'r', encoding='utf-8') as f:
    for line in f:
        existing.append(json.loads(line))

print(f"已有数据: {len(existing)} 条")

NEW_QA = []

# 更多变体生成
# 1. 场景+技巧组合
scenes = ["咖啡厅", "书店", "健身房", "公园", "商场", "餐厅", "酒吧", "博物馆", "电影院", "海滩",
          "图书馆", "教室", "办公室", "聚会", "婚礼", "派对", "音乐会", "展览", "比赛", "瑜伽馆"]

techniques = ["开场白", "Kino", "推拉", "DHV", "冷读", "时间桥梁", "舒适感建立", "情绪引导"]

for scene in scenes:
    for tech in techniques:
        NEW_QA.append({
            "input": f"在{scene}如何运用{tech}技巧？",
            "target": f"在{scene}运用{tech}技巧需要观察环境和对方状态。关键是自然、真诚，不要给对方压力。技巧是辅助，真诚是基础。"
        })

# 2. 信号+阶段组合
signals = ["主动联系", "回复快", "回复慢", "分享日常", "吃醋", "撒娇", "生气", "冷淡", "热情", "害羞"]

stages = ["刚认识", "熟悉后", "暧昧期", "约会后", "表白后", "长期关系", "异地恋", "吵架后"]

for signal in signals:
    for stage in stages:
        NEW_QA.append({
            "input": f"{stage}女生{signal}代表什么？",
            "target": f"{stage}女生{signal}需要结合具体情况判断。不同阶段同一信号可能有不同含义，要综合其他信号分析。"
        })

# 3. 问题+方法组合
problems = ["不回消息", "冷淡", "生气", "吃醋", "说累了", "说无聊", "说想你了", "说生病了", "说睡不着", "说分手"]

methods = ["关心", "倾听", "安慰", "建议", "陪伴", "转移话题", "幽默化解", "真诚道歉", "给空间", "主动联系"]

for problem in problems:
    for method in methods:
        NEW_QA.append({
            "input": f"她{problem}如何{method}？",
            "target": f"她{problem}时{method}要真诚适度。观察她的反应，不要过度或敷衍。关键是让她感受到你的关心。"
        })

# 4. 约会+方面组合
dates = ["咖啡约会", "晚餐约会", "电影约会", "公园约会", "博物馆约会", "游乐园约会", "海滩约会", "爬山约会"]

aspects = ["安排", "话题", "穿着", "礼仪", "买单", "结束", "跟进", "升级关系", "制造浪漫", "避免尴尬"]

for date in dates:
    for aspect in aspects:
        NEW_QA.append({
            "input": f"{date}的{aspect}要注意什么？",
            "target": f"{date}的{aspect}要考虑对方感受。提前准备但保持灵活，注意细节让对方感到被重视。"
        })

# 5. 心态+解决方案组合
issues = ["自卑", "焦虑", "嫉妒", "不安全感", "过度依赖", "害怕被拒绝", "完美主义", "患得患失"]

solutions = ["认识问题根源", "建立自我价值", "保持独立生活", "寻求支持", "给自己时间", "调整认知", "练习新行为"]

for issue in issues:
    for solution in solutions:
        NEW_QA.append({
            "input": f"恋爱中{issue}如何通过{solution}改善？",
            "target": f"通过{solution}改善{issue}需要持续努力。心态建设是长期过程，不要急于求成。"
        })

# 6. 长期关系问题组合
problems = ["信任危机", "沟通障碍", "生活琐事", "经济问题", "家庭矛盾", "异地困难", "性格差异", "平淡期"]

approaches = ["坦诚沟通", "互相理解", "寻找共识", "适度妥协", "共同努力", "寻求帮助", "给彼此空间", "重新约会"]

for problem in problems:
    for approach in approaches:
        NEW_QA.append({
            "input": f"长期关系中{problem}如何通过{approach}解决？",
            "target": f"通过{approach}解决{problem}需要双方配合。长期关系需要持续经营，遇到问题及时处理。"
        })

# 7. 实战问答组合
questions = ["你在干嘛", "你在哪里", "你今天开心吗", "你觉得我怎么样", "你喜欢什么样的女生", 
             "你谈过几次恋爱", "你为什么喜欢我", "你想我了吗", "你在忙什么", "你吃饭了吗"]

situations = ["刚认识时", "暧昧期", "约会后", "吵架后", "冷战后", "和好后", "长期关系中", "异地恋"]

for q in questions:
    for situation in situations:
        NEW_QA.append({
            "input": f"{situation}她问'{q}'怎么回？",
            "target": f"{situation}她问'{q}'要根据关系程度回复。保持真诚，不要敷衍或过度，观察她的反应调整。"
        })

# 8. 技巧+方法组合
techniques = ["制造悬念", "制造惊喜", "制造浪漫", "制造期待", "制造安全感", "制造亲密感"]

methods = ["语言", "行为", "礼物", "活动", "态度", "距离", "时间", "空间"]

for tech in techniques:
    for method in methods:
        NEW_QA.append({
            "input": f"如何通过{method}{tech}？",
            "target": f"通过{method}{tech}要自然适度。技巧是辅助，真诚是基础。过度使用技巧会显得不真诚。"
        })

# 9. 肢体语言组合
body_parts = ["眼睛", "嘴巴", "头部", "手臂", "手", "腿", "脚", "身体"]

actions = ["看", "笑", "点头", "摇头", "倾斜", "交叉", "触碰", "移动", "靠近", "后退"]

contexts = ["聊天时", "约会时", "暧昧时", "吵架时", "和好时", "表白时", "分手时", "见面时"]

for part in body_parts:
    for action in actions:
        for context in contexts:
            NEW_QA.append({
                "input": f"{context}女生用{part}{action}代表什么？",
                "target": f"{context}女生用{part}{action}需要结合情境判断。单一信号不能确定含义，要观察整体肢体语言。"
            })

# 10. 推拉话术组合
positives = ["聪明", "漂亮", "有趣", "温柔", "独立", "坚强", "开朗", "自信", "善良", "可爱"]

negatives = ["有时候会犯傻", "偶尔很无聊", "有时候很凶", "偶尔也需要依赖", "内心其实很柔软"]

situations = ["聊天时", "约会时", "暧昧时", "表白时", "吵架后"]

for pos in positives:
    for neg in negatives:
        for situation in situations:
            NEW_QA.append({
                "input": f"{situation}推拉话术：{pos}但{neg}？",
                "target": f"{situation}可以这样说：'你很{pos}，虽然{neg}，但我觉得这样很真实。'推拉要温和，不要伤害对方。"
            })

# 合并数据
all_data = existing + NEW_QA
print(f"新增数据: {len(NEW_QA)} 条")
print(f"总数据: {len(all_data)} 条")

# 限制在20000条
if len(all_data) > 20000:
    all_data = all_data[:20000]
    print(f"限制后: {len(all_data)} 条")

# 保存
output_file = "/home/z/my-project/恋爱训练数据/高质量数据/love_technology_qa.jsonl"
with open(output_file, 'w', encoding='utf-8') as f:
    for item in all_data:
        f.write(json.dumps(item, ensure_ascii=False) + '\n')

print(f"已保存到: {output_file}")
