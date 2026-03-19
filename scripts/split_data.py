#!/usr/bin/env python3
"""
数据分割工具
- 按大小分割
- 按数量分割
- 生成校验文件
"""

import json
import os
import gzip
import hashlib
from datetime import datetime

def split_by_count(input_file, output_dir, count_per_file=500000):
    """按数量分割文件"""
    os.makedirs(output_dir, exist_ok=True)
    
    file_index = 1
    current_count = 0
    current_file = None
    stats = {"total": 0, "files": []}
    
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            if current_file is None or current_count >= count_per_file:
                if current_file:
                    current_file.close()
                    # 压缩
                    compress_file(current_filename)
                    stats["files"].append({
                        "name": os.path.basename(current_filename + ".gz"),
                        "count": current_count
                    })
                
                current_filename = os.path.join(output_dir, f"olive_train_{file_index:03d}.jsonl")
                current_file = open(current_filename, 'w', encoding='utf-8')
                current_count = 0
                file_index += 1
            
            current_file.write(line)
            current_count += 1
            stats["total"] += 1
    
    if current_file:
        current_file.close()
        compress_file(current_filename)
        stats["files"].append({
            "name": os.path.basename(current_filename + ".gz"),
            "count": current_count
        })
    
    # 保存统计信息
    stats_file = os.path.join(output_dir, "data_stats.json")
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    return stats

def compress_file(filepath):
    """压缩文件"""
    with open(filepath, 'rb') as f_in:
        with gzip.open(filepath + '.gz', 'wb') as f_out:
            f_out.writelines(f_in)
    os.remove(filepath)  # 删除原文件

def generate_md5(directory):
    """为目录下所有gz文件生成MD5"""
    for filename in os.listdir(directory):
        if filename.endswith('.gz'):
            filepath = os.path.join(directory, filename)
            md5 = calculate_md5(filepath)
            md5_file = filepath + '.md5'
            with open(md5_file, 'w') as f:
                f.write(f"{md5}  {filename}\n")
            print(f"MD5: {filename} -> {md5}")

def calculate_md5(filepath):
    """计算文件MD5"""
    md5_hash = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b""):
            md5_hash.update(chunk)
    return md5_hash.hexdigest()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("用法: python split_data.py <输入文件> <输出目录> [每文件数量]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    count_per_file = int(sys.argv[3]) if len(sys.argv) > 3 else 500000
    
    print(f"分割文件: {input_file}")
    print(f"输出目录: {output_dir}")
    print(f"每文件数量: {count_per_file}")
    
    stats = split_by_count(input_file, output_dir, count_per_file)
    generate_md5(output_dir)
    
    print(f"\n完成！总数据: {stats['total']}, 文件数: {len(stats['files'])}")
