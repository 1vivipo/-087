#!/usr/bin/env python3
"""
恋爱追女生智能体 - 推理脚本
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

def load_model(base_model_path, lora_path=None):
    """加载模型"""
    tokenizer = AutoTokenizer.from_pretrained(
        base_model_path,
        trust_remote_code=True
    )
    
    model = AutoModelForCausalLM.from_pretrained(
        base_model_path,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )
    
    if lora_path:
        model = PeftModel.from_pretrained(model, lora_path)
    
    return model, tokenizer

def chat(model, tokenizer, question, max_length=512):
    """对话推理"""
    prompt = f"### 指令:\n{question}\n\n### 输出:\n"
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    outputs = model.generate(
        **inputs,
        max_length=max_length,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
        pad_token_id=tokenizer.pad_token_id
    )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # 提取输出部分
    if "### 输出:" in response:
        response = response.split("### 输出:")[-1].strip()
    return response

def main():
    print("=" * 60)
    print("恋爱追女生智能体 - 对话系统")
    print("=" * 60)
    
    # 配置
    MODEL_PATH = "Qwen/Qwen2-7B-Instruct"
    LORA_PATH = "output/love-agent-lora"  # 训练后的模型路径
    
    print("\n加载模型中...")
    model, tokenizer = load_model(MODEL_PATH, LORA_PATH)
    
    print("\n开始对话 (输入 'quit' 退出)")
    print("-" * 60)
    
    while True:
        try:
            question = input("\n你: ").strip()
            
            if question.lower() in ['quit', 'exit', 'q']:
                print("再见！")
                break
            
            if not question:
                continue
            
            response = chat(model, tokenizer, question)
            print(f"\n恋爱助手: {response}")
            
        except KeyboardInterrupt:
            print("\n再见！")
            break

if __name__ == "__main__":
    main()
