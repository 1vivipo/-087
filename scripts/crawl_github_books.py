#!/usr/bin/env python3
"""
爬取GitHub上的恋爱学书籍仓库
"""

import requests
import os
import time
import json
import re

OUTPUT_DIR = "/home/z/my-project/恋爱训练数据/书籍原文"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# GitHub API
GITHUB_API = "https://api.github.com"
HEADERS = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

# 已知的恋爱学相关仓库
KNOWN_REPOS = [
    "pua-books",
    "dating-books", 
    "love-books",
    "relationship-advice",
    "seduction-materials",
]

# 搜索关键词
SEARCH_KEYWORDS = [
    "pua",
    "dating",
    "seduction",
    "relationship",
    "love",
    "attraction",
    "flirting",
    "pickup",
]

def search_repos(keyword, max_results=10):
    """搜索GitHub仓库"""
    url = f"{GITHUB_API}/search/repositories"
    params = {
        'q': f'{keyword} books OR pdf OR epub',
        'sort': 'stars',
        'order': 'desc',
        'per_page': max_results
    }
    
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=30)
        if response.status_code == 200:
            return response.json().get('items', [])
    except Exception as e:
        print(f"搜索失败: {e}")
    return []

def get_repo_contents(owner, repo, path=""):
    """获取仓库内容"""
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"获取内容失败: {e}")
    return []

def download_file(url, filename):
    """下载文件"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=60)
        if response.status_code == 200:
            filepath = os.path.join(OUTPUT_DIR, filename)
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f"✅ 下载: {filename} ({len(response.content)} bytes)")
            return True
    except Exception as e:
        print(f"下载失败: {e}")
    return False

def process_repo(repo):
    """处理单个仓库"""
    owner = repo['owner']['login']
    name = repo['name']
    full_name = repo['full_name']
    stars = repo['stargazers_count']
    
    print(f"\n处理仓库: {full_name} ({stars} stars)")
    
    # 获取仓库内容
    contents = get_repo_contents(owner, name)
    
    if not contents:
        print("  无法获取内容")
        return
    
    for item in contents:
        if item['type'] == 'file':
            filename = item['name']
            # 检查文件类型
            if any(ext in filename.lower() for ext in ['.pdf', '.epub', '.txt', '.md', '.json']):
                download_url = item.get('download_url')
                if download_url:
                    # 保存文件名包含仓库名
                    safe_filename = f"{owner}_{name}_{filename}"
                    safe_filename = re.sub(r'[^\w\-_\.]', '_', safe_filename)
                    download_file(download_url, safe_filename)
                    time.sleep(1)
        
        elif item['type'] == 'dir':
            # 递归获取子目录
            subdir_contents = get_repo_contents(owner, name, item['path'])
            for subitem in subdir_contents:
                if subitem['type'] == 'file':
                    filename = subitem['name']
                    if any(ext in filename.lower() for ext in ['.pdf', '.epub', '.txt', '.md', '.json']):
                        download_url = subitem.get('download_url')
                        if download_url:
                            safe_filename = f"{owner}_{name}_{filename}"
                            safe_filename = re.sub(r'[^\w\-_\.]', '_', safe_filename)
                            download_file(download_url, safe_filename)
                            time.sleep(1)

def main():
    print("=" * 60)
    print("GitHub恋爱学书籍爬取")
    print("=" * 60)
    
    all_repos = []
    
    # 搜索仓库
    for keyword in SEARCH_KEYWORDS:
        print(f"\n搜索关键词: {keyword}")
        repos = search_repos(keyword, 5)
        for repo in repos:
            if repo['full_name'] not in [r['full_name'] for r in all_repos]:
                all_repos.append(repo)
        time.sleep(2)
    
    print(f"\n找到 {len(all_repos)} 个仓库")
    
    # 处理每个仓库
    for repo in all_repos[:20]:  # 限制处理数量
        process_repo(repo)
        time.sleep(3)
    
    print("\n" + "=" * 60)
    print("爬取完成")
    print("=" * 60)

if __name__ == "__main__":
    main()
