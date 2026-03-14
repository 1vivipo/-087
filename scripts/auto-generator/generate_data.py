#!/usr/bin/env python3
"""
自动数据生成系统 - 使用讯飞 API
24小时不间断生成恋爱训练数据
"""

import json
import time
import random
import requests
import base64
import hmac
import hashlib
from datetime import datetime
from urllib.parse import urlencode, urlparse
import os

# 讯飞 API 配置
API_URL = "https://spark-api-open.xf-yun.com/v1/chat/completions"
API_PASSWORD = "lnrcrGZxTrbpqdlPgQgy:iMGQczteqhbJPqXuBDuv"

# 数据保存路径
DATA_DIR = "/home/z/my-project/恋爱训练数据/自动生成"
os.makedirs(DATA_DIR, exist_ok=True)

# 场景模板
SCENARIOS = [
    {
        "scene": "用户疲惫",
        "user_inputs": [
            "我今天真的好累",
            "工作太累了，感觉被压垮了",
            "每天都是一样的工作，好疲惫",
            "加班到很晚，身心俱疲",
            "感觉生活压力好大",
            "最近总是感觉很累",
            "没有力气做任何事了",
            "累到不想说话",
        ],
        "context": "用户是一个疲惫的人，需要从恋爱心理学角度给予安慰和建议"
    },
    {
        "scene": "恋爱困惑",
        "user_inputs": [
            "她为什么不回我消息",
            "我是不是做错了什么",
            "她好像对我冷淡了",
            "不知道她喜不喜欢我",
            "我们之间感觉怪怪的",
            "她是不是有别人了",
            "怎么判断她对我有没有意思",
            "她对我忽冷忽热的",
        ],
        "context": "用户在恋爱中感到困惑，需要分析和建议"
    },
    {
        "scene": "表白焦虑",
        "user_inputs": [
            "我想表白但不敢",
            "什么时候表白最合适",
            "怎么知道她喜不喜欢我",
            "表白被拒绝怎么办",
            "怎么表白成功率最高",
            "我怕表白后连朋友都做不成",
            "有没有什么表白技巧",
            "她对我有好感吗",
        ],
        "context": "用户想要表白但很焦虑，需要指导和鼓励"
    },
    {
        "scene": "约会紧张",
        "user_inputs": [
            "第一次约会好紧张",
            "约会去哪里比较好",
            "约会时聊什么话题",
            "怎么给对方留下好印象",
            "约会时要注意什么",
            "约会穿什么好",
            "约会总是冷场怎么办",
            "怎么安排约会流程",
        ],
        "context": "用户对约会感到紧张，需要实用建议"
    },
    {
        "scene": "吵架矛盾",
        "user_inputs": [
            "我们吵架了怎么办",
            "她生气了不理我",
            "怎么哄女朋友",
            "吵架后怎么和好",
            "她总是因为小事生气",
            "我们经常吵架",
            "怎么避免吵架",
            "吵架后谁先低头",
        ],
        "context": "用户和伴侣吵架了，需要解决矛盾的建议"
    },
    {
        "scene": "异地恋",
        "user_inputs": [
            "异地恋好难坚持",
            "异地恋怎么维持感情",
            "她不在身边好想念",
            "异地恋总是没有安全感",
            "怎么给异地恋女友惊喜",
            "异地恋见面做什么",
            "异地恋怎么沟通",
            "异地恋能长久吗",
        ],
        "context": "用户正在经历异地恋，需要维护关系的建议"
    },
    {
        "scene": "暧昧关系",
        "user_inputs": [
            "我们关系很好但不确定",
            "她好像对我有意思",
            "怎么判断是不是暧昧",
            "暧昧期怎么突破",
            "她把我当备胎了吗",
            "怎么从暧昧变成恋人",
            "暧昧太久了好累",
            "她对我若即若离",
        ],
        "context": "用户处于暧昧关系中，需要分析和指导"
    },
    {
        "scene": "分手挽回",
        "user_inputs": [
            "她要和我分手",
            "怎么挽回前女友",
            "分手后还能复合吗",
            "她有了新男朋友",
            "分手后怎么走出来",
            "还能做朋友吗",
            "怎么忘记一个人",
            "分手后她不理我",
        ],
        "context": "用户面临分手或已分手，需要挽回或放下的建议"
    },
    {
        "scene": "自我提升",
        "user_inputs": [
            "怎么提升自己的魅力",
            "怎么变得自信",
            "怎么让自己更有吸引力",
            "女生喜欢什么样的男生",
            "怎么改变自己",
            "怎么培养气质",
            "怎么提升聊天技巧",
            "怎么变得幽默",
        ],
        "context": "用户想要提升自己，需要成长建议"
    },
    {
        "scene": "日常聊天",
        "user_inputs": [
            "今天天气真好",
            "周末有什么好玩的",
            "最近看了部电影",
            "推荐一些好吃的",
            "有什么好听的音乐",
            "最近在追什么剧",
            "假期去哪里玩",
            "有什么兴趣爱好",
        ],
        "context": "日常闲聊，需要自然、有趣的回应"
    }
]

def call_xunfei_api(messages):
    """调用讯飞 API"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_PASSWORD}"
    }
    
    data = {
        "model": "generalv3.5",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result.get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            print(f"API 错误: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"请求失败: {e}")
        return None

def generate_dialogue(scene, user_input, context):
    """生成对话数据"""
    system_prompt = f"""你是一个专业的恋爱咨询师，精通心理学、沟通技巧和恋爱技巧。
你的任务是帮助用户解决恋爱中的各种问题，提供专业、真诚、有建设性的建议。

当前场景：{scene}
背景信息：{context}

请用温暖、专业、真诚的语气回应用户，回复要有深度和实用性，200-500字左右。"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]
    
    response = call_xunfei_api(messages)
    return response

def generate_multi_turn_dialogue(scene, context, turns=3):
    """生成多轮对话"""
    system_prompt = f"""你是一个专业的恋爱咨询师，精通心理学、沟通技巧和恋爱技巧。
当前场景：{scene}
背景信息：{context}

请用温暖、专业、真诚的语气回应用户。每次回复100-300字。"""

    # 随机选择起始问题
    scenario = next((s for s in SCENARIOS if s["scene"] == scene), SCENARIOS[0])
    start_input = random.choice(scenario["user_inputs"])
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": start_input}
    ]
    
    dialogue_data = []
    
    for turn in range(turns):
        response = call_xunfei_api(messages)
        if not response:
            break
        
        dialogue_data.append({
            "role": "user" if turn == 0 else "assistant",
            "content": start_input if turn == 0 else response
        })
        
        if turn < turns - 1:
            # 生成追问
            follow_up_prompt = "基于上面的对话，用户可能会追问什么？只输出追问内容，不要其他解释。"
            messages.append({"role": "assistant", "content": response})
            messages.append({"role": "user", "content": follow_up_prompt})
            
            follow_up = call_xunfei_api(messages)
            if follow_up:
                start_input = follow_up
                messages[-1] = {"role": "user", "content": follow_up}
    
    return dialogue_data

def save_data(data, filename):
    """保存数据"""
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'a', encoding='utf-8') as f:
        f.write(json.dumps(data, ensure_ascii=False) + '\n')

def main():
    print("=" * 60)
    print("自动数据生成系统启动")
    print("=" * 60)
    
    total_generated = 0
    start_time = time.time()
    
    while True:
        try:
            # 随机选择场景
            scenario = random.choice(SCENARIOS)
            scene = scenario["scene"]
            context = scenario["context"]
            user_input = random.choice(scenario["user_inputs"])
            
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 生成: {scene}")
            print(f"  用户: {user_input}")
            
            # 生成单轮对话
            response = generate_dialogue(scene, user_input, context)
            
            if response:
                data = {
                    "instruction": user_input,
                    "input": "",
                    "output": response,
                    "category": scene,
                    "timestamp": datetime.now().isoformat()
                }
                save_data(data, f"dialogue_{scene}.jsonl")
                total_generated += 1
                print(f"  助手: {response[:100]}...")
                print(f"  ✅ 已生成 {total_generated} 条")
            
            # 每10条生成一组多轮对话
            if total_generated % 10 == 0:
                print(f"\n生成多轮对话...")
                multi_dialogue = generate_multi_turn_dialogue(scene, context)
                if multi_dialogue:
                    data = {
                        "dialogue": multi_dialogue,
                        "category": scene,
                        "type": "multi_turn",
                        "timestamp": datetime.now().isoformat()
                    }
                    save_data(data, f"multi_turn_{scene}.jsonl")
                    print(f"  ✅ 多轮对话已保存")
            
            # 控制频率
            time.sleep(2)
            
            # 每小时报告
            if total_generated % 100 == 0:
                elapsed = (time.time() - start_time) / 3600
                print(f"\n{'='*60}")
                print(f"运行报告: 已生成 {total_generated} 条数据")
                print(f"运行时间: {elapsed:.1f} 小时")
                print(f"生成速度: {total_generated/elapsed:.1f} 条/小时")
                print(f"{'='*60}\n")
                
        except KeyboardInterrupt:
            print(f"\n\n停止生成。总计: {total_generated} 条")
            break
        except Exception as e:
            print(f"错误: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
