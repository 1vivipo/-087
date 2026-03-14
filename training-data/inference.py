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
    prompt = f"""你是一个专业的恋爱咨询师，请回答以下问题：

问题：{question}

回答："""
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    outputs = model.generate(
        **inputs,
        max_length=max_length,
        temperature=0.7,
        top_p=0.9,
        do_sample=True
    )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return response

def main():
    print("=" * 50)
    print("恋爱追女生智能体 - 对话系统")
    print("=" * 50)
    
    # 加载模型
    MODEL_PATH = "Qwen/Qwen2-7B-Instruct"
    LORA_PATH = "output/love-agent-lora"
    
    print("\n加载模型中...")
    model, tokenizer = load_model(MODEL_PATH, LORA_PATH)
    
    print("\n开始对话 (输入 'quit' 退出)")
    print("-" * 50)
    
    while True:
        question = input("\n你的问题: ").strip()
        
        if question.lower() == 'quit':
            print("再见！")
            break
        
        if not question:
            continue
        
        response = chat(model, tokenizer, question)
        print(f"\n回答: {response}")

if __name__ == "__main__":
    main()
