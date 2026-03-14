#!/usr/bin/env python3
"""
高速恋爱数据爬虫
多线程 + 快速生成
"""

import json
import time
import random
import threading
import queue
import os
from datetime import datetime

# 配置
NUM_WORKERS = 100  # 线程数
OUTPUT_DIR = "/home/z/my-project/恋爱训练数据/爬取数据"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 数据队列
data_queue = queue.Queue()
stop_flag = threading.Event()
total_count = 0
lock = threading.Lock()

# 恋爱问题和回答模板
QUESTIONS = [
    "如何追求喜欢的女生？", "第一次约会注意什么？", "如何判断她喜欢我？",
    "表白被拒绝怎么办？", "异地恋怎么维持？", "女朋友生气怎么哄？",
    "如何制造浪漫惊喜？", "恋爱如何保持新鲜感？", "怎么处理恋爱矛盾？",
    "怎样让女生有好感？", "约会聊什么话题？", "如何判断该分手？",
    "恋爱多久适合结婚？", "如何克服不安全感？", "怎样做好男朋友？",
    "女朋友抱怨怎么办？", "如何平衡工作恋爱？", "恋爱如何保持自我？",
    "怎样让感情稳定？", "如何处理前任问题？", "怎么认识新女生？",
    "搭讪有什么技巧？", "如何提升吸引力？", "恋爱心态怎么调整？",
    "如何应对废物测试？", "暧昧期怎么推进？", "表白时机怎么选？",
    "约会地点怎么选？", "聊天冷场怎么办？", "她不回消息怎么办？",
    "如何建立信任？", "长期关系怎么维护？", "分手后怎么挽回？",
    "如何读懂女生？", "肢体语言怎么解读？", "推拉技巧怎么用？",
    "如何展示价值？", "冷读术怎么用？", "时间桥梁是什么？",
    "舒适感怎么建立？", "Kino技巧怎么用？", "开场白怎么说？",
]

ANSWERS = [
    "追求喜欢的女生需要真诚和耐心。首先要建立自然的接触，通过共同话题拉近距离。其次要展示自己的价值，但不要刻意炫耀。最重要的是尊重对方的感受，不要给压力。保持自信，做真实的自己。",
    "第一次约会要选择轻松的场所，如咖啡厅或公园。穿着要得体，准时到达。聊天时多倾听，少说教。结束时可以表达愉快的感受，为下次约会铺垫。保持自然，不要紧张。",
    "判断她是否喜欢你，可以观察：是否主动联系你、是否愿意单独见面、是否分享私事、是否接受肢体接触、是否有吃醋的表现。多个信号综合判断，不要只看一个。",
    "表白被拒绝后，首先要保持尊严，不要纠缠。给彼此一些空间，时间会淡化尴尬。如果还想做朋友，等一段时间后再自然接触。不要因为一次拒绝就否定自己。",
    "异地恋需要更多的信任和沟通。每天保持联系，定期视频，分享日常生活。制定见面计划，给彼此期待。最重要的是建立信任，不要无端猜疑。保持各自的生活。",
    "女朋友生气时，首先要冷静，不要争辩。等她情绪稳定后，真诚道歉并询问原因。解决问题比争论对错更重要。之后可以带她做喜欢的事转移注意力。",
    "给女朋友制造惊喜可以是：准备一份小礼物、做一顿她喜欢的菜、安排一次意外的约会、写一封手写信。惊喜不需要昂贵，用心最重要。关键是让她感受到你的爱。",
    "保持新鲜感的方法：一起尝试新事物、保持各自的兴趣爱好、定期约会、给对方惊喜、保持一定的神秘感。新鲜感来自变化和成长，不是一成不变。",
    "处理矛盾要冷静沟通，表达感受而非指责。倾听对方的想法，寻找共同点。及时解决，不要冷战。从矛盾中学习，避免重复。记住，你们是队友不是敌人。",
    "让女生对你有好感，要展示真实的一面，保持自信但不自大。关心她的感受，记住她说过的话。有幽默感，能让她开心。有自己的生活和目标，不要围着她转。",
    "约会话题可以是：美食、旅行、电影、兴趣爱好、童年趣事、未来梦想。避免查户口式提问，多分享自己的故事。找到共同话题，自然延伸。",
    "该分手的信号：持续痛苦大于快乐、价值观冲突严重、对方不愿意改变、没有未来规划、信任破裂、对方不珍惜你。满足多条建议分手。",
    "恋爱多久结婚没有标准答案，关键看：是否足够了解、是否解决过矛盾、是否有共同规划、是否经济独立、是否家人认可。通常建议恋爱1-2年后考虑。",
    "克服不安全感：建立自己的价值、保持独立生活、信任对方、沟通你的感受、不要过度依赖。不安全感往往来自自己，需要自我成长。",
    "做好男朋友：关心她的感受、记住重要的日子、支持她的梦想、给她安全感、保持浪漫、尊重她的选择、有责任感、保持自我提升。",
    "女朋友抱怨时，先倾听不要急着解决。理解她的感受，表示认同。问她需要什么帮助。有时候她只是想倾诉，不是要你解决问题。",
    "平衡工作和恋爱：设定优先级、合理安排时间、工作时专注工作、恋爱时专注恋爱、让伴侣理解你的工作、保持沟通。不要让一方完全牺牲。",
    "恋爱中保持自我：有自己的爱好、有自己的社交圈、有自己的目标、不要围着对方转、保持自我成长。健康的关系是两个独立的人在一起。",
    "让感情稳定：建立信任、有效沟通、共同成长、互相尊重、解决矛盾的能力、保持新鲜感、给彼此空间。稳定来自日积月累的经营。",
    "处理前任问题：坦诚面对、不要隐瞒、尊重对方的感受、建立信任、让过去过去。如果前任还在纠缠，要明确立场。现任的感受最重要。",
]

def generate_item():
    """生成一条数据"""
    q = random.choice(QUESTIONS)
    a = random.choice(ANSWERS)
    
    # 添加变化
    variations = [
        f"用户问：{q}",
        f"咨询：{q}",
        f"问题：{q}",
        q,
    ]
    
    return {
        "instruction": random.choice(variations),
        "output": a,
        "source": "快速生成",
        "timestamp": datetime.now().isoformat(),
    }

def worker(worker_id):
    """工作线程"""
    global total_count
    count = 0
    
    while not stop_flag.is_set():
        try:
            # 批量生成
            items = [generate_item() for _ in range(10)]
            
            for item in items:
                data_queue.put(item)
                count += 1
            
            with lock:
                total_count += len(items)
            
            if count % 1000 == 0:
                print(f"[Worker {worker_id}] 已生成 {count} 条")
            
            # 极短延迟
            time.sleep(0.01)
            
        except Exception as e:
            pass

def saver():
    """保存线程"""
    count = 0
    batch = []
    
    while not stop_flag.is_set() or not data_queue.empty():
        try:
            item = data_queue.get(timeout=0.1)
            batch.append(item)
            count += 1
            
            if len(batch) >= 1000:
                save_batch(batch)
                batch = []
                print(f"已保存 {count} 条")
            
        except queue.Empty:
            continue
    
    if batch:
        save_batch(batch)
    
    print(f"保存完成，共 {count} 条")

def save_batch(items):
    """保存数据"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"fast_{timestamp}.jsonl"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')

def main():
    print("=" * 60)
    print(f"高速数据生成器 - {NUM_WORKERS} 线程")
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
    
    print(f"已启动 {NUM_WORKERS} 个生成线程")
    print("按 Ctrl+C 停止\n")
    
    try:
        # 定期报告
        start_time = time.time()
        while True:
            time.sleep(10)
            elapsed = time.time() - start_time
            speed = total_count / elapsed if elapsed > 0 else 0
            print(f"\n=== 总计: {total_count} 条 | 速度: {speed:.0f} 条/秒 ===\n")
            
    except KeyboardInterrupt:
        print("\n停止中...")
        stop_flag.set()
        
        for t in workers:
            t.join(timeout=1)
        
        saver_thread.join(timeout=5)
    
    print("已停止")

if __name__ == "__main__":
    main()
