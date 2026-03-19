#!/usr/bin/env python3
"""
恋爱学内容爬取脚本
爬取公开的恋爱学文章和知识
"""

import requests
import json
import time
import re
from bs4 import BeautifulSoup
import os

# 保存目录
SAVE_DIR = "/home/z/my-project/恋爱训练数据/爬取数据"
os.makedirs(SAVE_DIR, exist_ok=True)

# 公开的恋爱学内容来源
SOURCES = [
    {
        "name": "知乎恋爱话题",
        "type": "zhihu",
        "urls": [
            "https://www.zhihu.com/topic/19554230/hot",  # 恋爱话题
            "https://www.zhihu.com/topic/19554231/hot",  # 恋爱心理
        ]
    },
    {
        "name": "公开电子书",
        "type": "ebook",
        "note": "需要手动添加公开版权的电子书"
    }
]

def clean_text(text):
    """清理文本"""
    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)
    # 移除特殊字符
    text = re.sub(r'[^\w\s\u4e00-\u9fff，。！？、；：""''（）【】《》]', '', text)
    return text.strip()

def crawl_zhihu_question(url):
    """爬取知乎问题"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 提取问题和回答
        question_title = soup.find('h1', class_='QuestionHeader-title')
        if question_title:
            question = question_title.text.strip()
            
            answers = soup.find_all('div', class_='RichContent-inner')
            data = []
            for answer in answers[:5]:  # 只取前5个回答
                text = clean_text(answer.text)
                if len(text) > 100:  # 只保留长回答
                    data.append({
                        "question": question,
                        "answer": text[:2000],  # 限制长度
                        "source": "知乎"
                    })
            
            return data
    except Exception as e:
        print(f"爬取失败: {e}")
        return []

def save_content(data, filename):
    """保存内容"""
    filepath = os.path.join(SAVE_DIR, filename)
    with open(filepath, 'a', encoding='utf-8') as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    print(f"已保存 {len(data)} 条到 {filename}")

# 示例：手动添加一些公开的恋爱学知识
SAMPLE_KNOWLEDGE = [
    {
        "title": "恋爱心理学基础",
        "content": """
恋爱心理学是研究恋爱关系中人类心理活动的学科。以下是一些核心概念：

1. 吸引力法则：人们会被与自己相似或互补的人吸引。相似性包括价值观、兴趣爱好、生活背景等。

2. 首因效应：第一印象在恋爱中非常重要，它会在对方心中形成持久的印象。

3. 互惠原则：人们倾向于回报他人的好意。在恋爱中，适当的付出会增加对方的好感。

4. 稀缺性原理：稀缺的东西更有价值。保持一定的神秘感和独立性可以增加吸引力。

5. 社会认同：人们会参考他人的行为来决定自己的行为。良好的社交评价会增加吸引力。
        """,
        "category": "心理学基础"
    },
    {
        "title": "沟通技巧要点",
        "content": """
有效的沟通是恋爱成功的关键：

1. 积极倾听：认真听对方说话，不要打断，用点头、眼神交流表示关注。

2. 开放式提问：用"你觉得...""你怎么看..."代替"是/否"问题，引导对方多说。

3. 表达感受：用"我感到..."而不是"你总是..."来表达不满，避免指责。

4. 非语言沟通：肢体语言、表情、语调占沟通的55%以上，注意这些细节。

5. 适时沉默：有时候沉默也是一种沟通，给对方思考和表达的空间。

6. 确认理解：重复对方的话确认理解正确，避免误解。
        """,
        "category": "沟通技巧"
    },
    {
        "title": "约会技巧指南",
        "content": """
成功的约会需要注意以下要点：

1. 选择地点：第一次约会选择轻松、有互动的地方，如咖啡厅、展览、游乐园。

2. 准时到达：守时显示尊重，建议提前5-10分钟到达。

3. 穿着得体：根据场合选择合适的服装，干净整洁是基本要求。

4. 话题准备：准备几个话题，如旅行、美食、电影、兴趣爱好。

5. 注意细节：开门、拉椅子、主动买单等小细节会加分。

6. 保持轻松：不要过于紧张，保持自然的微笑和幽默感。

7. 适度分享：分享自己的故事，但不要过度自我暴露。

8. 结束时机：在气氛好的时候结束，留下期待感。
        """,
        "category": "约会技巧"
    },
    {
        "title": "表白时机判断",
        "content": """
什么时候表白最合适？看这些信号：

1. 频繁联系：她主动找你聊天，回复很快。

2. 愿意独处：不排斥和你单独见面。

3. 分享私事：告诉你她的秘密和烦恼。

4. 肢体接触：不排斥偶然的身体接触。

5. 眼神交流：经常看你，眼神停留时间长。

6. 特别对待：对你比对其他人更好。

7. 关心你：询问你的生活、工作、感受。

8. 嫉妒反应：当你提到其他异性时会有反应。

如果这些信号大部分是肯定的，就可以考虑表白了。
        """,
        "category": "表白技巧"
    },
    {
        "title": "异地恋维护指南",
        "content": """
异地恋需要更多的信任和经营：

1. 固定联系：每天至少一次联系，可以是视频、语音或文字。

2. 分享日常：让对方参与你的生活，分享照片、视频。

3. 创造见面机会：定期见面，哪怕只是短暂的周末。

4. 建立信任：诚实透明，不隐瞒，及时报备。

5. 共同目标：制定结束异地的计划和时间表。

6. 惊喜元素：偶尔寄礼物、写信，制造浪漫。

7. 理解包容：理解对方的处境，不要无理取闹。

8. 保持自我：有自己的生活，不要过度依赖对方。
        """,
        "category": "异地恋"
    }
]

def main():
    print("=" * 60)
    print("恋爱学内容收集")
    print("=" * 60)
    
    # 保存示例知识
    print("\n保存示例恋爱学知识...")
    for item in SAMPLE_KNOWLEDGE:
        data = {
            "instruction": f"请详细讲解：{item['title']}",
            "input": "",
            "output": item['content'],
            "category": item['category']
        }
        save_content([data], "love_knowledge.jsonl")
    
    print("\n✅ 完成！")
    print(f"\n数据保存在: {SAVE_DIR}")
    print("\n提示：你可以手动添加更多公开版权的恋爱学书籍内容")

if __name__ == "__main__":
    main()
