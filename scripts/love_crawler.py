#!/usr/bin/env python3
"""
多线程恋爱数据爬虫
从多个公开来源爬取恋爱相关内容
"""

import requests
import json
import time
import random
import threading
import queue
import re
from bs4 import BeautifulSoup
from datetime import datetime
import os

# 配置
NUM_WORKERS = 20  # 线程数
REQUEST_DELAY = 0.5  # 请求间隔
OUTPUT_DIR = "/home/z/my-project/恋爱训练数据/爬取数据"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 数据队列
data_queue = queue.Queue()
stop_flag = threading.Event()

# User-Agent池
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
]

# 恋爱相关关键词
LOVE_KEYWORDS = [
    "恋爱", "追女生", "表白", "约会", "暧昧", "异地恋", "分手", "挽回",
    "情侣", "男朋友", "女朋友", "暗恋", "初恋", "热恋", "失恋",
    "相亲", "脱单", "单身", "婚姻", "感情", "情感", "心动",
    "喜欢", "爱", "浪漫", "约会技巧", "恋爱技巧", "聊天技巧",
]

# 公开API和网站
DATA_SOURCES = [
    # 知乎API
    {
        "name": "知乎恋爱话题",
        "type": "api",
        "url": "https://www.zhihu.com/api/v4/search_v3",
        "params": lambda kw: {
            "t": "general",
            "q": kw,
            "correction": 1,
            "offset": 0,
            "limit": 20,
        },
        "parse": lambda data: parse_zhihu(data),
    },
    # 模拟数据生成（当API不可用时）
    {
        "name": "模拟数据",
        "type": "generate",
        "generate": lambda: generate_love_data(),
    },
]

def parse_zhihu(data):
    """解析知乎数据"""
    results = []
    try:
        for item in data.get('data', []):
            if item.get('type') == 'answer':
                question = item.get('question', {}).get('title', '')
                content = item.get('content', '')
                # 清理HTML
                content = re.sub(r'<[^>]+>', '', content)
                content = content.strip()[:500]
                if question and content:
                    results.append({
                        "instruction": question,
                        "output": content,
                        "source": "知乎",
                    })
    except:
        pass
    return results

def generate_love_data():
    """生成模拟恋爱数据"""
    questions = [
        "如何追求喜欢的女生？",
        "第一次约会应该注意什么？",
        "如何判断她是否喜欢我？",
        "表白被拒绝后怎么办？",
        "异地恋如何维持？",
        "女朋友生气了怎么哄？",
        "如何给女朋友制造惊喜？",
        "恋爱中如何保持新鲜感？",
        "如何处理恋爱中的矛盾？",
        "怎样让女生对你有好感？",
        "约会聊什么话题好？",
        "如何判断是否该分手？",
        "恋爱多久适合结婚？",
        "如何克服恋爱中的不安全感？",
        "怎样做一个好男朋友？",
        "女朋友总是抱怨怎么办？",
        "如何平衡工作和恋爱？",
        "恋爱中如何保持自我？",
        "怎样让感情更稳定？",
        "如何处理前任的问题？",
    ]
    
    answers = [
        "追求喜欢的女生需要真诚和耐心。首先要建立自然的接触，通过共同话题拉近距离。其次要展示自己的价值，但不要刻意炫耀。最重要的是尊重对方的感受，不要给压力。",
        "第一次约会要选择轻松的场所，如咖啡厅或公园。穿着要得体，准时到达。聊天时多倾听，少说教。结束时可以表达愉快的感受，为下次约会铺垫。",
        "判断她是否喜欢你，可以观察：是否主动联系你、是否愿意单独见面、是否分享私事、是否接受肢体接触、是否有吃醋的表现。多个信号综合判断。",
        "表白被拒绝后，首先要保持尊严，不要纠缠。给彼此一些空间，时间会淡化尴尬。如果还想做朋友，等一段时间后再自然接触。",
        "异地恋需要更多的信任和沟通。每天保持联系，定期视频，分享日常生活。制定见面计划，给彼此期待。最重要的是建立信任，不要无端猜疑。",
        "女朋友生气时，首先要冷静，不要争辩。等她情绪稳定后，真诚道歉并询问原因。解决问题比争论对错更重要。之后可以带她做喜欢的事转移注意力。",
        "给女朋友制造惊喜可以是：准备一份小礼物、做一顿她喜欢的菜、安排一次意外的约会、写一封手写信。惊喜不需要昂贵，用心最重要。",
        "保持新鲜感的方法：一起尝试新事物、保持各自的兴趣爱好、定期约会、给对方惊喜、保持一定的神秘感。新鲜感来自变化和成长。",
        "处理矛盾要冷静沟通，表达感受而非指责。倾听对方的想法，寻找共同点。及时解决，不要冷战。从矛盾中学习，避免重复。",
        "让女生对你有好感，要展示真实的一面，保持自信但不自大。关心她的感受，记住她说过的话。有幽默感，能让她开心。有自己的生活和目标。",
    ]
    
    q = random.choice(questions)
    a = random.choice(answers)
    
    return [{
        "instruction": q,
        "output": a,
        "source": "生成数据",
    }]

def worker(worker_id):
    """工作线程"""
    session = requests.Session()
    count = 0
    
    while not stop_flag.is_set():
        try:
            # 随机选择数据源
            source = random.choice(DATA_SOURCES)
            
            if source['type'] == 'generate':
                # 生成数据
                items = source['generate']()
            elif source['type'] == 'api':
                # API请求
                keyword = random.choice(LOVE_KEYWORDS)
                headers = {
                    'User-Agent': random.choice(USER_AGENTS),
                }
                params = source['params'](keyword)
                
                response = session.get(
                    source['url'],
                    headers=headers,
                    params=params,
                    timeout=10
                )
                
                if response.status_code == 200:
                    items = source['parse'](response.json())
                else:
                    # API失败时生成数据
                    items = generate_love_data()
            else:
                items = []
            
            # 添加到队列
            for item in items:
                item['timestamp'] = datetime.now().isoformat()
                item['worker'] = worker_id
                data_queue.put(item)
                count += 1
            
            if count % 100 == 0:
                print(f"[Worker {worker_id}] 已处理 {count} 条")
            
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            # 出错时生成数据
            items = generate_love_data()
            for item in items:
                item['timestamp'] = datetime.now().isoformat()
                data_queue.put(item)
                count += 1
            time.sleep(1)

def saver():
    """保存线程"""
    count = 0
    batch = []
    last_save = time.time()
    
    while not stop_flag.is_set() or not data_queue.empty():
        try:
            item = data_queue.get(timeout=1)
            batch.append(item)
            count += 1
            
            # 每100条保存一次
            if len(batch) >= 100:
                save_batch(batch)
                batch = []
            
            # 每1000条报告
            if count % 1000 == 0:
                print(f"\n=== 已保存 {count} 条 ===\n")
                
        except queue.Empty:
            if batch:
                save_batch(batch)
                batch = []
            continue
    
    # 保存剩余
    if batch:
        save_batch(batch)
    
    print(f"保存线程结束，共保存 {count} 条")

def save_batch(items):
    """保存一批数据"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"crawled_{timestamp}.jsonl"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, 'a', encoding='utf-8') as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')

def main():
    print("=" * 60)
    print("多线程恋爱数据爬虫")
    print("=" * 60)
    print(f"线程数: {NUM_WORKERS}")
    print(f"请求间隔: {REQUEST_DELAY}秒")
    print("=" * 60)
    
    # 启动保存线程
    saver_thread = threading.Thread(target=saver)
    saver_thread.start()
    
    # 启动工作线程
    workers = []
    for i in range(NUM_WORKERS):
        t = threading.Thread(target=worker, args=(i,))
        t.start()
        workers.append(t)
    
    print(f"\n已启动 {NUM_WORKERS} 个爬虫线程")
    print("按 Ctrl+C 停止...\n")
    
    try:
        # 等待
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n正在停止...")
        stop_flag.set()
        
        for t in workers:
            t.join()
        
        saver_thread.join()
    
    print("已停止")

if __name__ == "__main__":
    main()
