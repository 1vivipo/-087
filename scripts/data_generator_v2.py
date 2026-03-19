#!/usr/bin/env python3
"""
橄榄子AI训练数据生成器 V2.0
- 40%书籍数据
- 60%情境数据
- 支持多轮对话
- 阶段感知
"""

import json
import os
import random
import re
from datetime import datetime

OUTPUT_DIR = "/home/z/my-project/恋爱训练数据/生成数据"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 系统指令
INSTRUCTION_STANDARD = "你是橄榄子，资深恋爱咨询师。请按【情境识别】【认知纠偏】【逻辑推理】【行动方案】【温暖引导】五步进行思维，最后按【抓重点】【拆逻辑】【给方案】【总结引导】结构回复。用温暖专业的语言帮助用户。"

def get_instruction_with_stage(stage):
    """获取带阶段的系统指令"""
    return f"你是橄榄子，资深恋爱咨询师。当前对话处于【{stage}】阶段。请按【情境识别】【认知纠偏】【逻辑推理】【行动方案】【温暖引导】五步进行思维，最后按【抓重点】【拆逻辑】【给方案】【总结引导】结构回复。用温暖专业的语言帮助用户，结合前序对话保持建议连贯。"

# 阶段定义
STAGES = {
    "陌生期": {
        "weight": 0.35,
        "sub_stages": ["完全陌生", "单次接触", "初步认识", "社交圈重叠"],
        "typical_questions": [
            "如何开场搭讪？",
            "怎么要联系方式？",
            "第一次说什么？",
            "在{scene}看到喜欢的女生，怎么自然地开场？",
            "她{signal}，这是什么意思？",
        ]
    },
    "熟悉期": {
        "weight": 0.30,
        "sub_stages": ["初步熟悉", "频繁互动", "单独约会", "接近暧昧"],
        "typical_questions": [
            "聊什么话题？",
            "怎么约她出来？",
            "她这是什么意思？",
            "我们聊天{situation}，她对我有意思吗？",
            "她{signal}，我应该怎么做？",
        ]
    },
    "暧昧期": {
        "weight": 0.25,
        "sub_stages": ["轻度暧昧", "中度暧昧", "高度暧昧", "表白前后"],
        "typical_questions": [
            "她是不是喜欢我？",
            "什么时候表白？",
            "表白被拒怎么办？",
            "我们{situation}，她对我有意思吗？",
            "我该表白吗？",
        ]
    },
    "其他": {
        "weight": 0.10,
        "sub_stages": ["热恋期", "平稳期", "危机期"],
        "typical_questions": [
            "如何维持关系？",
            "她要分手怎么办？",
            "怎么挽回？",
        ]
    }
}

# 场景库
SCENES = ["咖啡厅", "书店", "健身房", "公园", "商场", "餐厅", "酒吧", "图书馆", "公司", "学校", "地铁", "公交", "聚会", "婚礼", "派对"]

# 信号库
SIGNALS = ["主动找我聊天", "回复很慢", "回复很快", "分享日常", "吃醋", "撒娇", "冷淡", "回避", "眼神接触", "微笑", "主动约我", "不回消息", "客气", "热情"]

# 情境库
SITUATIONS = ["聊得很开心", "突然冷淡了", "有说有笑", "有点尴尬", "她主动了", "她回避了", "她吃醋了", "她害羞了"]

# 生成单轮数据
def generate_single_turn_data(stage, count):
    """生成单轮对话数据"""
    data = []
    stage_info = STAGES.get(stage, STAGES["其他"])
    
    for _ in range(count):
        sub_stage = random.choice(stage_info["sub_stages"])
        question_template = random.choice(stage_info["typical_questions"])
        
        # 填充模板
        question = question_template
        if "{scene}" in question:
            question = question.replace("{scene}", random.choice(SCENES))
        if "{signal}" in question:
            question = question.replace("{signal}", random.choice(SIGNALS))
        if "{situation}" in question:
            question = question.replace("{situation}", random.choice(SITUATIONS))
        
        # 生成回答（简化版，实际需要更复杂的逻辑）
        answer = generate_answer(stage, sub_stage, question)
        
        data.append({
            "instruction": INSTRUCTION_STANDARD,
            "input": question,
            "output": answer
        })
    
    return data

# 生成回答
def generate_answer(stage, sub_stage, question):
    """生成回答（基于模板）"""
    
    # 思维链部分
    thinking = f"""【思维链】
1. 情境识别：用户处于【{stage}-{sub_stage}】阶段，问题是"{question}"。需要分析具体情况，给出针对性建议。
2. 认知纠偏：很多人在这种情况下会感到困惑，我理解你的感受。让我们换个角度来看这个问题。
3. 逻辑推理：根据恋爱学原理，{stage}阶段的关键是{get_stage_key(stage)}。
4. 行动方案：{get_action_plan(stage, question)}
5. 温暖引导：记住，追求爱情是美好的，但也要爱护自己。用真诚和耐心来建立关系。"""
    
    # 结构化回答
    key_point = f"【抓重点】{get_key_point(stage, question)}"
    
    logic = f"【拆逻辑】{get_logic(stage, question)}"
    
    plan = f"【给方案】\n{get_detailed_plan(stage, question)}"
    
    summary = f"【总结引导】{get_summary(stage, question)}"
    
    return f"{thinking}\n\n{key_point}\n\n{logic}\n\n{plan}\n\n{summary}"

def get_stage_key(stage):
    """获取阶段关键任务"""
    keys = {
        "陌生期": "建立印象、寻找机会、自然开场",
        "熟悉期": "加深了解、建立舒适感、展示价值",
        "暧昧期": "升级关系、测试信号、确认心意",
        "其他": "维护关系、解决问题"
    }
    return keys.get(stage, "建立健康的关系")

def get_action_plan(stage, question):
    """获取行动方案概述"""
    return f"针对你的问题，建议{random.choice(['先观察她的反应', '从自然的话题开始', '给彼此一些空间', '逐步升级关系', '保持真诚的态度'])}。"

def get_key_point(stage, question):
    """获取核心要点"""
    templates = [
        f"在{stage}阶段，关键是保持自然和真诚。",
        f"这个问题很常见，让我们一步步来解决。",
        f"你的感受是正常的，让我们找到最好的方式。",
        f"记住，健康的关系建立在相互尊重的基础上。",
    ]
    return random.choice(templates)

def get_logic(stage, question):
    """获取逻辑分析"""
    templates = [
        f"在{stage}阶段，她的行为可能有多种含义。不要过度解读，保持理性分析。真诚是最好的策略，用你的真心去对待她。",
        f"你现在的处境我能理解。在{stage}阶段，最重要的是保持自己的节奏，不要因为焦虑而做出冲动的决定。",
        f"让我们来分析一下。她的行为可能是在{random.choice(['观察你', '测试你的反应', '表达她的兴趣', '保持距离'])}。无论哪种情况，保持真诚和耐心都是最好的选择。",
    ]
    return random.choice(templates)

def get_detailed_plan(stage, question):
    """获取详细方案"""
    plans = [
        "1. 保持自然：不要过度准备，想到什么说什么。\n2. 观察反应：注意她的肢体语言和回应。\n3. 逐步深入：从表面话题慢慢过渡到更深入的内容。\n4. 保持平衡：不要总是你主动，给她主动的空间。\n5. 真诚为本：用真心去对待她，比任何技巧都有效。",
        "1. 建立价值：展示你的生活、兴趣、能力。\n2. 创造机会：寻找自然的互动机会。\n3. 保持节奏：不要急于推进，让关系自然发展。\n4. 观察信号：注意她对你的兴趣程度。\n5. 适时调整：根据她的反应调整你的策略。",
        "1. 放松心态：不要过度紧张，把她当成普通朋友。\n2. 寻找共同点：发现你们的共同兴趣。\n3. 分享感受：分享你的想法和经历。\n4. 尊重边界：不要给她压力，尊重她的选择。\n5. 保持自信：相信自己的价值。",
    ]
    return random.choice(plans)

def get_summary(stage, question):
    """获取总结引导"""
    templates = [
        "记住，你值得被好好对待。在追求她的同时，也要爱护自己。健康的关系是双向的。",
        "你的真诚和耐心会让她感受到你的用心。保持自己的节奏，相信美好的事情会发生。",
        "追求爱情是美好的旅程。保持真诚，尊重她，也尊重自己。你做得很好。",
        "每段关系都是独特的，没有标准答案。相信自己的感觉，也尊重她的节奏。你值得幸福。",
    ]
    return random.choice(templates)

# 生成多轮对话数据
def generate_multi_turn_data(stage, rounds, count):
    """生成多轮对话数据"""
    data = []
    
    for _ in range(count):
        conversation = generate_conversation(stage, rounds)
        data.extend(conversation)
    
    return data

def generate_conversation(stage, rounds):
    """生成一轮完整对话"""
    conversation = []
    stage_info = STAGES.get(stage, STAGES["其他"])
    
    # 生成对话流程
    flow = [
        ("初始问题", "我{situation}，怎么办？"),
        ("行动反馈", "【前情：{prev}】我按你说的做了，她{reaction}，接下来怎么办？"),
        ("新问题", "【前情：{prev}】现在我们{new_situation}，但我{concern}。"),
        ("困惑/犹豫", "【前情：{prev}】我还是不确定{uncertainty}。"),
        ("决策点", "【前情：{prev}】我该{decision}吗？"),
        ("心态/后续", "【前情：{prev}】如果{worst_case}，我该怎么处理？"),
    ]
    
    prev_summary = ""
    
    for i, (turn_type, template) in enumerate(flow[:rounds]):
        # 填充模板
        question = template
        question = question.replace("{situation}", random.choice(["喜欢一个女生", "遇到一个女生", "想追一个女生"]))
        question = question.replace("{prev}", prev_summary or "刚开始")
        question = question.replace("{reaction}", random.choice(["主动了", "有反应了", "开始理我了"]))
        question = question.replace("{new_situation}", random.choice(["有说有笑", "开始互动", "聊得不错"]))
        question = question.replace("{concern}", random.choice(["不敢表白", "不确定她的心意", "有点紧张"]))
        question = question.replace("{uncertainty}", random.choice(["她是不是喜欢我", "她对我什么感觉", "我们算什么关系"]))
        question = question.replace("{decision}", random.choice(["表白", "约她", "进一步"]))
        question = question.replace("{worst_case}", random.choice(["被拒绝", "她不同意", "失败了"]))
        
        # 更新前情摘要
        prev_summary = f"{turn_type}后{random.choice(['关系改善', '有进展', '情况变化'])}"
        
        # 生成回答
        answer = generate_answer(stage, random.choice(stage_info["sub_stages"]), question)
        
        # 使用带阶段的指令
        instruction = get_instruction_with_stage(f"{stage}-{stage_info['sub_stages'][i % len(stage_info['sub_stages'])]}")
        
        conversation.append({
            "instruction": instruction,
            "input": question,
            "output": answer
        })
    
    return conversation

# 主函数
def main():
    print("=" * 60)
    print("橄榄子AI训练数据生成器 V2.0")
    print("=" * 60)
    
    total_count = 0
    
    # 生成各阶段数据
    for stage, info in STAGES.items():
        stage_count = int(100 * info["weight"])  # 示例：生成100条
        print(f"\n生成 {stage} 数据: {stage_count} 条")
        
        # 单轮数据（60%）
        single_count = int(stage_count * 0.6)
        single_data = generate_single_turn_data(stage, single_count)
        
        # 多轮数据（40%）
        multi_count = stage_count - single_count
        multi_data = generate_multi_turn_data(stage, random.choice([3, 4, 5, 6]), multi_count // 3)
        
        # 保存
        all_data = single_data + multi_data
        filename = f"olive_{stage}.jsonl"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            for item in all_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        
        print(f"  保存: {filename} ({len(all_data)} 条)")
        total_count += len(all_data)
    
    print(f"\n总计生成: {total_count} 条")
    print("=" * 60)

if __name__ == "__main__":
    main()
