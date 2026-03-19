#!/usr/bin/env python3
"""
用书籍内容生成训练数据
将书籍章节转换为问答格式
"""

import json
import os
import requests
import time

# 讯飞 API
API_KEY = "FIKXFvJFvyoizbgKtmcZ:BkOdFCmpqtkGIUWZxwKD"
BASE_URL = "https://spark-api-open.xf-yun.com/v1"
MODEL = "lite"

# 目录
BOOKS_DIR = "/home/z/my-project/data/books"
OUTPUT_DIR = "/home/z/my-project/恋爱训练数据/书籍训练数据"
os.makedirs(OUTPUT_DIR, exist_ok=True)

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
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat/completions",
            headers=headers,
            json=data,
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        else:
            print(f"API 错误: {response.status_code}")
            return None
    except Exception as e:
        print(f"请求失败: {e}")
        return None

def generate_qa_from_content(title, content, chapter_title):
    """从内容生成问答数据"""
    
    # 生成多个问题
    questions = [
        f"请详细讲解《{title}》中关于{chapter_title}的内容",
        f"在恋爱中，{chapter_title}有什么重要作用？",
        f"如何理解和应用{chapter_title}？"
    ]
    
    results = []
    for q in questions:
        system = f"""你是一个恋爱咨询师，请基于以下内容回答问题：

【书籍】{title}
【章节】{chapter_title}
【内容】{content}

请用专业、真诚的语气回答，200-400字。"""
        
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": q}
        ]
        
        answer = call_api(messages)
        if answer:
            results.append({
                "instruction": q,
                "input": "",
                "output": answer,
                "category": "书籍知识",
                "source": title
            })
            time.sleep(1)  # 避免频率限制
    
    return results

def process_books():
    """处理所有书籍"""
    print("=" * 60)
    print("处理书籍生成训练数据")
    print("=" * 60)
    
    total = 0
    
    # 遍历书籍
    for filename in os.listdir(BOOKS_DIR):
        if filename.startswith('book_') and filename.endswith('.json'):
            filepath = os.path.join(BOOKS_DIR, filename)
            
            with open(filepath, 'r') as f:
                book = json.load(f)
            
            title = book.get('title', '')
            outline = book.get('outline', [])
            
            print(f"\n处理: {title}")
            print(f"大纲章节数: {len(outline)}")
            
            # 如果有大纲，用大纲生成内容
            for chapter in outline[:5]:  # 每本书处理前5章
                chapter_title = chapter.get('title', '')
                key_points = chapter.get('keyPoints', [])
                
                # 用大纲生成内容
                system = f"""你是一个恋爱学作家，请根据以下大纲写出章节内容：

【书名】{title}
【章节】{chapter_title}
【要点】{', '.join(key_points)}

请写一篇500-800字的章节内容，风格专业但易懂。"""
                
                messages = [
                    {"role": "system", "content": system},
                    {"role": "user", "content": f"请写出《{chapter_title}》的完整内容"}
                ]
                
                content = call_api(messages)
                
                if content:
                    # 生成问答
                    qa_data = generate_qa_from_content(title, content, chapter_title)
                    
                    # 保存
                    for qa in qa_data:
                        with open(f"{OUTPUT_DIR}/book_qa.jsonl", 'a', encoding='utf-8') as f:
                            f.write(json.dumps(qa, ensure_ascii=False) + '\n')
                        total += 1
                    
                    print(f"  {chapter_title}: 生成 {len(qa_data)} 条")
                    time.sleep(1)
    
    print(f"\n✅ 完成！共生成 {total} 条训练数据")
    print(f"保存位置: {OUTPUT_DIR}")

if __name__ == "__main__":
    process_books()
