#!/usr/bin/env python3
"""
平衡版高速数据生成器
确保保存速度跟上生成速度
"""

import json
import time
import random
import threading
import os
from datetime import datetime

# 配置
NUM_WORKERS = 200  # 减少线程数
OUTPUT_DIR = "/home/z/my-project/恋爱训练数据/爬取数据"
os.makedirs(OUTPUT_DIR, exist_ok=True)

stop_flag = threading.Event()
total_count = 0
lock = threading.Lock()

# 问题和回答
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
]

def generate_item():
    """生成一条数据"""
    q = random.choice(QUESTIONS)
    a = random.choice(ANSWERS)
    prefixes = ["", "用户问：", "咨询：", "问题：", "求助："]
    return {
        "instruction": random.choice(prefixes) + q,
        "output": a,
        "source": "高速生成",
        "timestamp": datetime.now().isoformat(),
    }

def worker(worker_id, file_handle, file_lock):
    """工作线程 - 直接写入文件"""
    global total_count
    count = 0
    
    while not stop_flag.is_set():
        try:
            # 生成数据
            items = [generate_item() for _ in range(50)]
            
            # 直接写入文件
            with file_lock:
                for item in items:
                    file_handle.write(json.dumps(item, ensure_ascii=False) + '\n')
                file_handle.flush()
            
            with lock:
                total_count += len(items)
                count += len(items)
            
            if count % 5000 == 0:
                print(f"[Worker {worker_id}] 已生成 {count} 条")
            
            time.sleep(0.01)
            
        except Exception as e:
            pass

def main():
    print("=" * 60)
    print(f"平衡版数据生成器 - {NUM_WORKERS} 线程")
    print("=" * 60)
    
    # 打开文件
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filepath = os.path.join(OUTPUT_DIR, f"balanced_{timestamp}.jsonl")
    file_handle = open(filepath, 'w', encoding='utf-8')
    file_lock = threading.Lock()
    
    # 启动工作线程
    workers = []
    for i in range(NUM_WORKERS):
        t = threading.Thread(target=worker, args=(i, file_handle, file_lock))
        t.daemon = True
        t.start()
        workers.append(t)
    
    print(f"已启动 {NUM_WORKERS} 个生成线程")
    print("按 Ctrl+C 停止\n")
    
    try:
        start_time = time.time()
        last_count = 0
        while True:
            time.sleep(10)
            elapsed = time.time() - start_time
            speed = total_count / elapsed if elapsed > 0 else 0
            print(f"总计: {total_count} 条 | 速度: {speed:.0f} 条/秒")
            
    except KeyboardInterrupt:
        print("\n停止中...")
        stop_flag.set()
        time.sleep(1)
        file_handle.close()
    
    print(f"已停止，共生成 {total_count} 条")

if __name__ == "__main__":
    main()
