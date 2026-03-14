#!/usr/bin/env python3
"""
橄榄子对抗训练脚本
使用男女Agent对抗生成高质量训练数据
"""

import sys
sys.path.append('.')

from olive_model import *
import json
import os

def run_battle_training():
    """运行对抗训练"""
    print("="*60)
    print("橄榄子对抗训练系统")
    print("="*60)
    
    # 初始化
    model = OliveModel().to(DEVICE)
    battle_system = BattleSystem(model)
    scenario_gen = ScenarioGenerator()
    
    # 加载已有模型（如果有）
    if os.path.exists("olive_chat.pth"):
        checkpoint = torch.load("olive_chat.pth", map_location=DEVICE)
        model.load_state_dict(checkpoint['model_state_dict'])
        print("✅ 已加载已有模型")
    
    # 生成训练数据
    all_training_data = []
    num_rounds = 100  # 对抗轮数
    
    print(f"\n开始对抗训练，共 {num_rounds} 轮...")
    
    for round_num in range(num_rounds):
        scenario = scenario_gen.generate()
        result = battle_system.battle(scenario, rounds=5)
        
        if result['quality'] >= 0.5:
            # 转换为训练数据
            dialogue = result['dialogue']
            for i in range(len(dialogue) - 1):
                all_training_data.append({
                    'instruction': dialogue[i]['message'],
                    'output': dialogue[i+1]['message'],
                    'category': scenario['category'],
                    'quality': result['quality']
                })
        
        if (round_num + 1) % 10 == 0:
            print(f"已完成 {round_num + 1}/{num_rounds} 轮，高质量数据: {len(all_training_data)}条")
    
    # 保存数据
    save_dir = "橄榄子模型/对抗数据"
    os.makedirs(save_dir, exist_ok=True)
    
    save_path = os.path.join(save_dir, f"battle_data_{len(all_training_data)}.jsonl")
    with open(save_path, 'w', encoding='utf-8') as f:
        for item in all_training_data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    print(f"\n✅ 对抗训练完成！")
    print(f"生成数据: {len(all_training_data)}条")
    print(f"保存位置: {save_path}")
    
    return all_training_data

if __name__ == "__main__":
    run_battle_training()
