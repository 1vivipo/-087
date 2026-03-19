#!/usr/bin/env python3
"""
将训练数据转换为可用于 llama.cpp 训练的格式
"""

import json

def convert_to_llama_format(input_file, output_file):
    """转换为 llama.cpp 训练格式"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = [json.loads(line) for line in f if line.strip()]
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for item in data:
            # llama.cpp 格式
            text = f"""### 指令:
{item['instruction']}

### 输入:
{item['input']}

### 输出:
{item['output']}

"""
            f.write(text)
    
    print(f"已转换 {len(data)} 条数据")
    print(f"保存到: {output_file}")

if __name__ == "__main__":
    convert_to_llama_format(
        "training-data/love_agent_train.jsonl",
        "training-data/love_agent_train.txt"
    )
