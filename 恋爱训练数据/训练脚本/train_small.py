#!/usr/bin/env python3
"""
小模型训练脚本 - 适合 Qwen2-0.5B 或 1.5B
可以在普通电脑或高端手机上运行
"""

import json
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import glob

def load_all_data(data_dir):
    """加载所有训练数据"""
    all_data = []
    for filepath in glob.glob(f"{data_dir}/**/*.jsonl", recursive=True):
        print(f"加载: {filepath}")
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    item = json.loads(line)
                    # 格式化为对话
                    if item.get('input'):
                        text = f"用户：{item['instruction']}\n背景：{item['input']}\n助手：{item['output']}"
                    else:
                        text = f"用户：{item['instruction']}\n助手：{item['output']}"
                    all_data.append({"text": text})
    return all_data

def main():
    print("=" * 60)
    print("恋爱助手小模型训练")
    print("=" * 60)
    
    # 配置 - 使用小模型
    MODEL_NAME = "Qwen/Qwen2-1.5B-Instruct"  # 或 "Qwen/Qwen2-0.5B-Instruct"
    DATA_DIR = "恋爱训练数据"
    OUTPUT_DIR = "output/love-agent-1.5b"
    
    # 加载 tokenizer
    print("\n[1/5] 加载 tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # 加载模型
    print("[2/5] 加载模型...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float32,  # 小模型用 float32
        trust_remote_code=True
    )
    
    # 加载数据
    print("[3/5] 加载训练数据...")
    data = load_all_data(DATA_DIR)
    print(f"总样本数: {len(data)}")
    
    # 数据集
    def tokenize(example):
        return tokenizer(
            example["text"],
            truncation=True,
            max_length=512,
            padding="max_length"
        )
    
    dataset = Dataset.from_list(data)
    tokenized_dataset = dataset.map(tokenize, remove_columns=["text"])
    
    # 训练参数
    print("[4/5] 配置训练...")
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=1,  # 小模型1轮就够了
        per_device_train_batch_size=1,  # 小批次
        learning_rate=1e-5,
        logging_steps=50,
        save_steps=500,
        save_total_limit=2,
        fp16=False,  # 小模型不用 fp16
    )
    
    # 训练
    print("[5/5] 开始训练...")
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        tokenizer=tokenizer,
    )
    
    trainer.train()
    
    # 保存
    print("\n保存模型...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    print(f"\n✅ 训练完成！模型保存在: {OUTPUT_DIR}")
    print("\n使用方法:")
    print(f"  model = AutoModelForCausalLM.from_pretrained('{OUTPUT_DIR}')")
    print(f"  tokenizer = AutoTokenizer.from_pretrained('{OUTPUT_DIR}')")

if __name__ == "__main__":
    main()
