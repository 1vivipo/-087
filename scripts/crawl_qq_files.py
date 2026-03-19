#!/usr/bin/env python3
"""
爬取QQ文件闪传链接
"""

import requests
import os
import time
from urllib.parse import unquote

# 输出目录
OUTPUT_DIR = "/home/z/my-project/恋爱训练数据/爬取资料"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 文件列表（排除2、7、8）
FILES = [
    ("决胜网络把妹.epub", "https://qfile.qq.com/q/iXHTaGQL5e"),
    # ("恋爱剧本-中子.pdf", "排除"),
    ("PUA成长之路.pdf", "https://qfile.qq.com/q/bmbjYIlMFq"),
    ("情感操控指南针.pdf", "https://qfile.qq.com/q/SpNTalmTy"),
    ("废物测试之话术惯例.pdf", "https://qfile.qq.com/q/AI9voVAzMA"),
    ("野兽绅士.epub", "https://qfile.qq.com/q/WE4fRpP6UY"),
    # ("话术红宝书.pdf", "排除"),
    # ("女生网聊语言分类.pdf", "排除"),
    ("时机网聊.pdf", "https://qfile.qq.com/q/6fywyNRJbq"),
    ("约会倍增术.pdf", "https://qfile.qq.com/q/s60ecm4sEw"),
    ("Brad的时尚圣经.pdf", "https://qfile.qq.com/q/Mx7zTLEYkE"),
    ("相爱指导手册.pdf", "https://qfile.qq.com/q/ngxwSoz8UE"),
    ("谜男全流程惯例.pdf", "https://qfile.qq.com/q/uXdW6xnUWY"),
    ("一约得吃核心笔记.pdf", "https://qfile.qq.com/q/4UL59lxZhm"),
    ("拉墨团队聊天汇总.pdf", "https://qfile.qq.com/q/kJrxwZxRmM"),
    ("诱惑术.pdf", "https://qfile.qq.com/q/ZBXSx5GBas"),
    ("高阶极速TD约会流程.pdf", "https://qfile.qq.com/q/vZfb4jTHfW"),
    ("操控基础三层次对话.pdf", "https://qfile.qq.com/q/7DEdwzyMsE"),
    ("魔鬼聊天术.epub", "https://qfile.qq.com/q/e2T6ibczgA"),
    ("如何来调情.txt", "https://qfile.qq.com/q/7ETLBpzbH4"),
    ("迷男方法.txt", "https://qfile.qq.com/q/jttFrSa4SI"),
    ("聊天记录解析.pdf", "https://qfile.qq.com/q/vjIvDk8fok"),
    ("速悦大灯案例.pptx", "https://qfile.qq.com/q/irp0hzerp6"),
]

# 请求头
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://qfile.qq.com/',
}

session = requests.Session()
session.headers.update(HEADERS)

def try_download(name, url):
    """尝试下载文件"""
    print(f"\n尝试下载: {name}")
    print(f"URL: {url}")
    
    try:
        # 先访问链接获取重定向
        response = session.get(url, allow_redirects=True, timeout=30)
        
        print(f"状态码: {response.status_code}")
        print(f"最终URL: {response.url}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'unknown')}")
        print(f"Content-Length: {response.headers.get('Content-Length', 'unknown')}")
        
        # 检查是否是文件
        content_type = response.headers.get('Content-Type', '')
        if 'application' in content_type or 'octet-stream' in content_type or 'pdf' in content_type or 'epub' in content_type:
            # 保存文件
            filepath = os.path.join(OUTPUT_DIR, name)
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            size = len(response.content)
            print(f"✅ 下载成功: {name} ({size} bytes)")
            return True
        else:
            # 可能是HTML页面
            if len(response.content) < 10000:
                print(f"响应内容 (前500字符):")
                print(response.text[:500])
            else:
                print(f"响应内容较大 ({len(response.content)} bytes)，可能是文件或页面")
                
            # 尝试保存看看
            filepath = os.path.join(OUTPUT_DIR, name)
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"已保存到: {filepath}")
            return True
            
    except Exception as e:
        print(f"❌ 下载失败: {e}")
        return False

def main():
    print("=" * 60)
    print("QQ文件爬取")
    print("=" * 60)
    
    success = 0
    failed = 0
    
    for name, url in FILES:
        if try_download(name, url):
            success += 1
        else:
            failed += 1
        time.sleep(2)  # 避免请求过快
    
    print("\n" + "=" * 60)
    print(f"完成: 成功 {success}, 失败 {failed}")
    print("=" * 60)

if __name__ == "__main__":
    main()
