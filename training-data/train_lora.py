#!/usr/bin/env python3
"""
恋爱追女生智能体 - LoRA 微调脚本
使用 Qwen2-7B-Instruct 作为基础模型
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

def load_data(filepath):
    """加载训练数据"""
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    return data

def format_data(example, tokenizer, max_length=2048):
    """格式化数据"""
    prompt = f"""### 指令:
{example['instruction']}

### 输入:
{example['input']}

### 输出:
{example['output']}"""
    
    tokenized = tokenizer(
        prompt,
        max_length=max_length,
        truncation=True,
        padding='max_length',
        return_tensors='pt'
    )
    
    tokenized['labels'] = tokenized['input_ids'].clone()
    return tokenized

def main():
    print("=" * 50)
    print("恋爱追女生智能体 - LoRA 微调")
    print("=" * 50)
    
    # 配置
    MODEL_NAME = "Qwen/Qwen2-7B-Instruct"
    DATA_PATH = "training-data/love_agent_train.jsonl"
    OUTPUT_DIR = "output/love-agent-lora"
    
    # 加载 tokenizer
    print("\n加载 tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME,
        trust_remote_code=True,
        padding_side='right'
    )
    
    # 加载模型
    print("加载基础模型...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )
    
    # 配置 LoRA
    print("配置 LoRA...")
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
    print("\n加载训练数据...")
    data = load_data(DATA_PATH)
    print(f"训练样本: {len(data)}条")
    
    dataset = Dataset.from_list(data)
    
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
        optim="adamw_torch"
    )
    
    # 开始训练
    print("\n开始训练...")
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        tokenizer=tokenizer
    )
    
    trainer.train()
    
    # 保存模型
    print("\n保存模型...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    print(f"\n✅ 训练完成！模型保存在: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
