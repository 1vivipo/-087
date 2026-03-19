#!/usr/bin/env python3
"""
恋爱追女生智能体 - LoRA 微调脚本
适用于单卡 GPU 训练
"""

import json
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForSeq2Seq
)
from peft import LoraConfig, get_peft_model, TaskType
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
                    all_data.append(json.loads(line))
    return all_data

def format_data(example, tokenizer, max_length=2048):
    """格式化数据"""
    if example.get('input'):
        prompt = f"### 指令:\n{example['instruction']}\n\n### 输入:\n{example['input']}\n\n### 输出:\n{example['output']}"
    else:
        prompt = f"### 指令:\n{example['instruction']}\n\n### 输出:\n{example['output']}"
    
    tokenized = tokenizer(
        prompt,
        max_length=max_length,
        truncation=True,
        padding='max_length',
        return_tensors='pt'
    )
    
    tokenized['labels'] = tokenized['input_ids'].clone()
    return {k: v.squeeze() for k, v in tokenized.items()}

def main():
    print("=" * 60)
    print("恋爱追女生智能体 - LoRA 微调训练")
    print("=" * 60)
    
    # 配置
    MODEL_NAME = "Qwen/Qwen2-7B-Instruct"  # 可换成其他模型
    DATA_DIR = "恋爱训练数据"
    OUTPUT_DIR = "output/love-agent-lora"
    
    # 加载 tokenizer
    print("\n[1/5] 加载 tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME,
        trust_remote_code=True,
        padding_side='right'
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # 加载模型
    print("[2/5] 加载基础模型...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )
    
    # 配置 LoRA
    print("[3/5] 配置 LoRA...")
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"]
    )
    
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # 加载数据
    print("[4/5] 加载训练数据...")
    data = load_all_data(DATA_DIR)
    print(f"总训练样本: {len(data)}条")
    
    # 转换数据
    def preprocess_function(example):
        return format_data(example, tokenizer)
    
    dataset = Dataset.from_list(data)
    tokenized_dataset = dataset.map(preprocess_function, remove_columns=dataset.column_names)
    
    # 训练参数
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        learning_rate=2e-5,
        logging_steps=100,
        save_steps=500,
        warmup_steps=100,
        fp16=True,
        optim="adamw_torch",
        report_to="none"
    )
    
    # 开始训练
    print("[5/5] 开始训练...")
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        tokenizer=tokenizer,
    )
    
    trainer.train()
    
    # 保存模型
    print("\n保存模型...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    print(f"\n✅ 训练完成！模型保存在: {OUTPUT_DIR}")
    print("\n使用方法:")
    print(f"  from transformers import AutoModelForCausalLM, AutoTokenizer")
    print(f"  from peft import PeftModel")
    print(f"  model = AutoModelForCausalLM.from_pretrained('{MODEL_NAME}')")
    print(f"  model = PeftModel.from_pretrained(model, '{OUTPUT_DIR}')")

if __name__ == "__main__":
    main()
