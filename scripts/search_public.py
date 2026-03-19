#!/usr/bin/env python3
"""
从公开来源搜索恋爱学资料
"""

import requests
import os

OUTPUT_DIR = "/home/z/my-project/恋爱训练数据/公开资料"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 一些公开的恋爱学相关资料链接
PUBLIC_SOURCES = [
    # GitHub上的公开资料
    {
        "name": "恋爱学笔记",
        "url": "https://raw.githubusercontent.com",
        "type": "github"
    },
]

# 尝试从一些公开API获取数据
def try_github_search():
    """搜索GitHub上的公开资料"""
    keywords = ["恋爱", "PUA", "把妹", "约会", "追女生"]
    
    for keyword in keywords:
        try:
            url = f"https://api.github.com/search/repositories?q={keyword}&sort=stars&order=desc"
            headers = {'Accept': 'application/vnd.github.v3+json'}
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                items = data.get('items', [])[:5]
                
                print(f"\n关键词 '{keyword}' 的热门仓库:")
                for item in items:
                    print(f"  - {item['full_name']} ({item['stargazers_count']} stars)")
                    print(f"    {item['description']}")
                    print(f"    {item['html_url']}")
        except Exception as e:
            print(f"搜索 {keyword} 失败: {e}")

print("=" * 60)
print("公开资料搜索")
print("=" * 60)

try_github_search()

print("\n" + "=" * 60)
print("搜索完成")
print("=" * 60)
