#!/usr/bin/env python3
"""
多进程并发数据生成
充分利用讯飞API的QPS限制
"""

import requests
import json
import time
import random
import os
import multiprocessing
from datetime import datetime

# 讯飞 API 配置
API_KEY = "FIKXFvJFvyoizbgKtmcZ:BkOdFCmpqtkGIUWZxwKD"
BASE_URL = "https://spark-api-open.xf-yun.com/v1"
MODEL = "lite"

# 并发配置
NUM_WORKERS = 4          # 进程数
REQUESTS_PER_WORKER = 2  # 每个进程每秒请求数
DELAY = 0.5              # 请求间隔（秒）

# 数据保存路径
DATA_DIR = "/home/z/my-project/恋爱训练数据/自动生成"
os.makedirs(DATA_DIR, exist_ok=True)

# 场景模板（扩展版）
SCENARIOS = [
    {
        "scene": "用户疲惫",
        "user_inputs": [
            "我今天真的好累", "工作太累了", "每天都是一样的工作",
            "加班到很晚", "感觉生活压力好大", "最近总是很累",
            "没有力气做任何事", "累到不想说话", "今天好累啊",
            "身心俱疲怎么办", "工作压力太大了", "感觉快撑不住了",
            "每天都很累", "累得不想动", "好想休息",
            "精神很疲惫", "身体很累", "心累",
        ],
        "context": "用户是一个疲惫的人，需要从恋爱心理学角度给予安慰和建议"
    },
    {
        "scene": "恋爱困惑",
        "user_inputs": [
            "她为什么不回我消息", "我是不是做错了什么",
            "她好像对我冷淡了", "不知道她喜不喜欢我",
            "我们之间感觉怪怪的", "她是不是有别人了",
            "怎么判断她对我有没有意思", "她对我忽冷忽热的",
            "她为什么不理我", "怎么知道她喜不喜欢我",
            "她对我是什么感觉", "她是不是在考验我",
            "她为什么突然不回消息", "她是不是不喜欢我了",
            "她对我爱答不理", "她好像在躲我",
        ],
        "context": "用户在恋爱中感到困惑，需要分析和建议"
    },
    {
        "scene": "表白焦虑",
        "user_inputs": [
            "我想表白但不敢", "什么时候表白最合适",
            "怎么知道她喜不喜欢我", "表白被拒绝怎么办",
            "怎么表白成功率最高", "我怕表白后连朋友都做不成",
            "有没有什么表白技巧", "她对我有好感吗",
            "怎么开口表白", "表白说什么好",
            "什么时候该表白", "怎么判断表白时机",
            "表白要注意什么", "怎么让表白更浪漫",
            "表白前要准备什么", "表白失败了怎么办",
        ],
        "context": "用户想要表白但很焦虑，需要指导和鼓励"
    },
    {
        "scene": "约会紧张",
        "user_inputs": [
            "第一次约会好紧张", "约会去哪里比较好",
            "约会时聊什么话题", "怎么给对方留下好印象",
            "约会时要注意什么", "约会穿什么好",
            "约会总是冷场怎么办", "怎么安排约会流程",
            "约会怎么准备", "约会去哪吃比较好",
            "约会怎么制造浪漫", "约会怎么避免尴尬",
            "约会聊什么不冷场", "约会怎么让她开心",
            "约会去哪里好", "约会怎么表现",
        ],
        "context": "用户对约会感到紧张，需要实用建议"
    },
    {
        "scene": "吵架矛盾",
        "user_inputs": [
            "我们吵架了怎么办", "她生气了不理我",
            "怎么哄女朋友", "吵架后怎么和好",
            "她总是因为小事生气", "我们经常吵架",
            "怎么避免吵架", "吵架后谁先低头",
            "她生气了怎么哄", "吵架了怎么挽回",
            "怎么化解矛盾", "她不理我了怎么办",
            "吵架后怎么沟通", "怎么让她消气",
            "吵架了很后悔", "怎么道歉比较好",
        ],
        "context": "用户和伴侣吵架了，需要解决矛盾的建议"
    },
    {
        "scene": "异地恋",
        "user_inputs": [
            "异地恋好难坚持", "异地恋怎么维持感情",
            "她不在身边好想念", "异地恋总是没有安全感",
            "怎么给异地恋女友惊喜", "异地恋见面做什么",
            "异地恋怎么沟通", "异地恋能长久吗",
            "异地恋怎么保持新鲜感", "异地恋好辛苦",
            "异地恋怎么信任对方", "异地恋怎么度过难关",
            "异地恋怎么表达爱", "异地恋怎么经营",
            "异地恋好孤独", "异地恋怎么见面",
        ],
        "context": "用户正在经历异地恋，需要维护关系的建议"
    },
    {
        "scene": "暧昧关系",
        "user_inputs": [
            "我们关系很好但不确定", "她好像对我有意思",
            "怎么判断是不是暧昧", "暧昧期怎么突破",
            "她把我当备胎了吗", "怎么从暧昧变成恋人",
            "暧昧太久了好累", "她对我若即若离",
            "怎么确认关系", "暧昧期怎么相处",
            "她是不是在玩暧昧", "怎么打破暧昧",
            "暧昧期怎么推进", "她对我是什么意思",
            "暧昧期要多久", "怎么让暧昧变成恋爱",
        ],
        "context": "用户处于暧昧关系中，需要分析和指导"
    },
    {
        "scene": "分手挽回",
        "user_inputs": [
            "她要和我分手", "怎么挽回前女友",
            "分手后还能复合吗", "她有了新男朋友",
            "分手后怎么走出来", "还能做朋友吗",
            "怎么忘记一个人", "分手后她不理我",
            "分手了怎么挽回", "分手后怎么联系她",
            "分手后怎么调整心态", "分手后还能挽回吗",
            "怎么面对分手", "分手后怎么重新开始",
            "分手很痛苦", "分手后怎么放下",
        ],
        "context": "用户面临分手或已分手，需要挽回或放下的建议"
    },
    {
        "scene": "自我提升",
        "user_inputs": [
            "怎么提升自己的魅力", "怎么变得自信",
            "怎么让自己更有吸引力", "女生喜欢什么样的男生",
            "怎么改变自己", "怎么培养气质",
            "怎么提升聊天技巧", "怎么变得幽默",
            "怎么提升自己", "怎么让自己更优秀",
            "怎么增加吸引力", "怎么提升情商",
            "怎么变得有魅力", "怎么让自己更有趣",
            "怎么提升形象", "怎么变得成熟",
        ],
        "context": "用户想要提升自己，需要成长建议"
    },
    {
        "scene": "日常聊天",
        "user_inputs": [
            "今天天气真好", "周末有什么好玩的",
            "最近看了部电影", "推荐一些好吃的",
            "有什么好听的音乐", "最近在追什么剧",
            "假期去哪里玩", "有什么兴趣爱好",
            "今天心情不错", "分享一件开心的事",
            "最近有什么新鲜事", "周末怎么过",
            "有什么好玩的", "今天发生了什么",
            "最近怎么样", "有什么有趣的事",
        ],
        "context": "日常闲聊，需要自然、有趣的回应"
    }
]

def call_api(messages):
    """调用讯飞 API"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    data = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 500
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            return None
    except:
        return None

def generate_dialogue(scene, user_input, context):
    """生成对话数据"""
    system_prompt = f"""你是一个专业的恋爱咨询师，精通心理学、沟通技巧和恋爱技巧。
你的任务是帮助用户解决恋爱中的各种问题，提供专业、真诚、有建设性的建议。

当前场景：{scene}
背景信息：{context}

请用温暖、专业、真诚的语气回应用户，回复要有深度和实用性，150-300字左右。"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ]
    
    return call_api(messages)

def worker(worker_id, result_queue):
    """工作进程"""
    count = 0
    
    while True:
        try:
            # 随机选择场景
            scenario = random.choice(SCENARIOS)
            scene = scenario["scene"]
            context = scenario["context"]
            user_input = random.choice(scenario["user_inputs"])
            
            # 生成对话
            response = generate_dialogue(scene, user_input, context)
            
            if response:
                data = {
                    "instruction": user_input,
                    "input": "",
                    "output": response,
                    "category": scene,
                    "timestamp": datetime.now().isoformat(),
                    "worker": worker_id
                }
                result_queue.put(data)
                count += 1
                
                if count % 10 == 0:
                    print(f"[Worker {worker_id}] 已生成 {count} 条")
            
            time.sleep(DELAY)
            
        except KeyboardInterrupt:
            print(f"[Worker {worker_id}] 停止，共生成 {count} 条")
            break
        except Exception as e:
            time.sleep(1)

def saver(result_queue):
    """保存进程"""
    counts = {}
    
    while True:
        try:
            data = result_queue.get()
            
            if data is None:
                break
            
            scene = data.get('category', 'unknown')
            filename = f"dialogue_{scene}.jsonl"
            filepath = os.path.join(DATA_DIR, filename)
            
            with open(filepath, 'a', encoding='utf-8') as f:
                f.write(json.dumps(data, ensure_ascii=False) + '\n')
            
            counts[scene] = counts.get(scene, 0) + 1
            
            # 每100条报告一次
            total = sum(counts.values())
            if total % 100 == 0:
                print(f"\n=== 总计: {total} 条 ===")
                for s, c in counts.items():
                    print(f"  {s}: {c} 条")
                print()
                
        except KeyboardInterrupt:
            break

def main():
    print("=" * 60)
    print("多进程并发数据生成系统")
    print("=" * 60)
    print(f"进程数: {NUM_WORKERS}")
    print(f"每进程请求间隔: {DELAY}秒")
    print(f"预估QPS: {NUM_WORKERS / DELAY}")
    print("=" * 60)
    
    # 创建队列
    result_queue = multiprocessing.Queue()
    
    # 启动保存进程
    saver_process = multiprocessing.Process(target=saver, args=(result_queue,))
    saver_process.start()
    
    # 启动工作进程
    workers = []
    for i in range(NUM_WORKERS):
        p = multiprocessing.Process(target=worker, args=(i, result_queue))
        p.start()
        workers.append(p)
    
    print("\n所有进程已启动，按 Ctrl+C 停止...")
    
    try:
        # 等待
        for p in workers:
            p.join()
    except KeyboardInterrupt:
        print("\n正在停止...")
        for p in workers:
            p.terminate()
        result_queue.put(None)
        saver_process.join()
    
    print("已停止")

if __name__ == "__main__":
    main()
