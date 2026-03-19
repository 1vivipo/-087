#!/usr/bin/env python3
"""
橄榄子 Olive - 恋爱实战AI教练
自我进化训练系统
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import json
import os
import random
import math
from collections import Counter
from datetime import datetime

# ======================
# 1. 模型配置
# ======================
class OliveConfig:
    # 模型参数（可调整大小）
    VOCAB_SIZE = 32000
    DIM_MODEL = 512      # 可增大到 768/1024
    N_LAYER = 8          # 可增大到 12/16
    N_HEAD = 8
    MAX_SEQ_LEN = 512
    FF_DIM = 2048
    DROPOUT = 0.1
    
    # 训练参数
    BATCH_SIZE = 4
    LR = 1e-4
    EPOCHS = 10
    
    # 自我进化参数
    SELF_PLAY_ROUNDS = 100      # 每轮自我博弈次数
    QUALITY_THRESHOLD = 0.7     # 数据质量阈值
    EVOLUTION_CYCLES = 5        # 进化循环次数

config = OliveConfig()
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ======================
# 2. 分词器
# ======================
class OliveTokenizer:
    """橄榄子分词器"""
    
    def __init__(self, vocab_size=32000):
        self.vocab_size = vocab_size
        self.char2idx = {}
        self.idx2char = {}
        
        # 特殊token
        self.special_tokens = {
            '<pad>': 0, '<unk>': 1, '<bos>': 2, '<eos>': 3,
            '<user>': 4, '<assistant>': 5,
            '<male>': 6, '<female>': 7,  # 性别标记
            '<scene>': 8,                 # 场景标记
        }
        self._build_vocab()
    
    def _build_vocab(self):
        # 特殊token
        for token, idx in self.special_tokens.items():
            self.char2idx[token] = idx
            self.idx2char[idx] = token
        
        # 常用字符
        chars = (
            "的一是不了在人有我他这个们中来上大为和国地到以说时要就出会可也你对生能而子那得于着下自之年过发后作里如家多成回两者都当等"
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "0123456789"
            "，。！？、；：""''（）【】《》,.!?;:\"'()[]<>"
            " \n\t"
        )
        
        idx = len(self.special_tokens)
        for char in chars:
            if char not in self.char2idx:
                self.char2idx[char] = idx
                self.idx2char[idx] = char
                idx += 1
        
        # 填充
        for i in range(idx, self.vocab_size):
            self.idx2char[i] = f'<extra_{i}>'
    
    def encode(self, text, max_len=None):
        tokens = [self.special_tokens['<bos>']]
        for char in text:
            tokens.append(self.char2idx.get(char, self.special_tokens['<unk>']))
        tokens.append(self.special_tokens['<eos>'])
        
        if max_len and len(tokens) > max_len:
            tokens = tokens[:max_len-1] + [self.special_tokens['<eos>']]
        return tokens
    
    def decode(self, tokens):
        chars = []
        for idx in tokens:
            if idx in self.idx2char:
                char = self.idx2char[idx]
                if char not in self.special_tokens:
                    chars.append(char)
        return ''.join(chars)
    
    def pad(self, tokens, max_len):
        if len(tokens) >= max_len:
            return tokens[:max_len]
        return tokens + [self.special_tokens['<pad>']] * (max_len - len(tokens))

tokenizer = OliveTokenizer(config.VOCAB_SIZE)

# ======================
# 3. 模型结构
# ======================
class OliveBlock(nn.Module):
    def __init__(self):
        super().__init__()
        self.attn = nn.MultiheadAttention(
            config.DIM_MODEL, config.N_HEAD, 
            batch_first=True, dropout=config.DROPOUT
        )
        self.norm1 = nn.LayerNorm(config.DIM_MODEL)
        self.norm2 = nn.LayerNorm(config.DIM_MODEL)
        self.ffn = nn.Sequential(
            nn.Linear(config.DIM_MODEL, config.FF_DIM),
            nn.GELU(),
            nn.Dropout(config.DROPOUT),
            nn.Linear(config.FF_DIM, config.DIM_MODEL),
            nn.Dropout(config.DROPOUT)
        )
    
    def forward(self, x):
        attn_out, _ = self.attn(x, x, x)
        x = self.norm1(x + attn_out)
        x = self.norm2(x + self.ffn(x))
        return x

class OliveModel(nn.Module):
    """橄榄子模型"""
    
    def __init__(self):
        super().__init__()
        self.emb = nn.Embedding(config.VOCAB_SIZE, config.DIM_MODEL)
        self.pos_emb = nn.Embedding(config.MAX_SEQ_LEN, config.DIM_MODEL)
        self.dropout = nn.Dropout(config.DROPOUT)
        self.layers = nn.ModuleList([OliveBlock() for _ in range(config.N_LAYER)])
        self.head = nn.Linear(config.DIM_MODEL, config.VOCAB_SIZE)
        self.apply(self._init_weights)
    
    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
    
    def forward(self, x):
        seq_len = x.size(1)
        pos = torch.arange(seq_len, device=x.device).unsqueeze(0)
        x = self.emb(x) + self.pos_emb(pos)
        x = self.dropout(x)
        for layer in self.layers:
            x = layer(x)
        return self.head(x)
    
    def generate(self, input_ids, max_new=100, temp=0.7, top_k=50):
        self.eval()
        with torch.no_grad():
            for _ in range(max_new):
                idx = input_ids[:, -config.MAX_SEQ_LEN:]
                logits = self(idx)[:, -1, :] / temp
                
                if top_k > 0:
                    v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                    logits[logits < v[:, [-1]]] = float('-inf')
                
                probs = F.softmax(logits, dim=-1)
                next_token = torch.multinomial(probs, 1)
                input_ids = torch.cat([input_ids, next_token], dim=1)
                
                if next_token.item() == tokenizer.special_tokens['<eos>']:
                    break
        return input_ids

# ======================
# 4. 对抗训练系统
# ======================
class BattleAgent:
    """对抗Agent"""
    
    def __init__(self, role, model=None):
        self.role = role  # 'male' or 'female'
        self.model = model
        self.win_count = 0
        self.lose_count = 0
    
    def respond(self, context, opponent_msg):
        """生成回复"""
        if self.role == 'male':
            prompt = f"场景：{context}\n女生说：{opponent_msg}\n男生回复："
        else:
            prompt = f"场景：{context}\n男生说：{opponent_msg}\n女生回复："
        
        # 如果有模型，用模型生成
        if self.model:
            input_ids = torch.tensor([tokenizer.encode(prompt)], device=DEVICE)
            output = self.model.generate(input_ids, max_new=100)
            return tokenizer.decode(output[0].tolist())
        
        # 否则用规则生成
        return self._rule_based_response(context, opponent_msg)
    
    def _rule_based_response(self, context, opponent_msg):
        """规则回复（无模型时）"""
        responses = {
            'male': [
                "我觉得你说得有道理，能详细说说吗？",
                "我理解你的感受，我也有类似的经历。",
                "这个问题确实很复杂，我们一起想想。",
                "你说的让我思考了很多，谢谢分享。",
            ],
            'female': [
                "嗯，我明白你的意思。",
                "你这么说我有点意外呢。",
                "我觉得这要看具体情况吧。",
                "你平时都是这样想的吗？",
            ]
        }
        return random.choice(responses[self.role])
    
    def get_win_rate(self):
        total = self.win_count + self.lose_count
        return self.win_count / total if total > 0 else 0

class BattleSystem:
    """对抗训练系统"""
    
    def __init__(self, model=None):
        self.male_agent = BattleAgent('male', model)
        self.female_agent = BattleAgent('female', model)
        self.battle_history = []
    
    def battle(self, scenario, rounds=5):
        """进行一轮对抗"""
        context = scenario.get('context', '')
        initial_msg = scenario.get('initial', '你好')
        
        dialogue = []
        current_msg = initial_msg
        current_speaker = 'female'
        
        for round_num in range(rounds):
            if current_speaker == 'male':
                response = self.male_agent.respond(context, current_msg)
                speaker_agent = self.male_agent
            else:
                response = self.female_agent.respond(context, current_msg)
                speaker_agent = self.female_agent
            
            dialogue.append({
                'speaker': current_speaker,
                'message': response
            })
            
            current_msg = response
            current_speaker = 'female' if current_speaker == 'male' else 'male'
        
        # 评估对话质量
        quality = self._evaluate_dialogue(dialogue, scenario)
        
        return {
            'scenario': scenario,
            'dialogue': dialogue,
            'quality': quality
        }
    
    def _evaluate_dialogue(self, dialogue, scenario):
        """评估对话质量"""
        # 简单评估：长度、多样性、相关性
        total_len = sum(len(d['message']) for d in dialogue)
        unique_msgs = len(set(d['message'] for d in dialogue))
        
        # 质量分数
        length_score = min(total_len / 500, 1.0)  # 长度适中
        diversity_score = unique_msgs / len(dialogue) if dialogue else 0
        
        quality = (length_score + diversity_score) / 2
        return quality
    
    def generate_training_data(self, scenarios, num_battles=100):
        """生成训练数据"""
        training_data = []
        
        for _ in range(num_battles):
            scenario = random.choice(scenarios)
            result = self.battle(scenario)
            
            if result['quality'] >= config.QUALITY_THRESHOLD:
                # 转换为训练格式
                for i in range(len(result['dialogue']) - 1):
                    user_msg = result['dialogue'][i]['message']
                    assistant_msg = result['dialogue'][i + 1]['message']
                    
                    training_data.append({
                        'instruction': user_msg,
                        'output': assistant_msg,
                        'category': scenario.get('category', '对抗训练'),
                        'quality': result['quality']
                    })
        
        return training_data

# ======================
# 5. 场景生成器
# ======================
class ScenarioGenerator:
    """恋爱场景生成器"""
    
    def __init__(self):
        self.scenarios = self._init_scenarios()
    
    def _init_scenarios(self):
        """初始化场景库"""
        return [
            {
                'category': '初次见面',
                'context': '咖啡厅，第一次约会',
                'initial': '你好，你是第一次来这里吗？',
                'difficulty': 1
            },
            {
                'category': '表白场景',
                'context': '公园散步，气氛很好',
                'initial': '其实我有话想对你说...',
                'difficulty': 3
            },
            {
                'category': '吵架和好',
                'context': '刚吵完架，想和好',
                'initial': '我们能不能好好聊聊？',
                'difficulty': 4
            },
            {
                'category': '异地恋',
                'context': '视频通话中',
                'initial': '今天好想你啊',
                'difficulty': 2
            },
            {
                'category': '暧昧期',
                'context': '微信聊天',
                'initial': '你今天干嘛了？',
                'difficulty': 2
            },
            {
                'category': '约会邀请',
                'context': '想约对方出来',
                'initial': '周末有空吗？',
                'difficulty': 1
            },
            {
                'category': '关心对方',
                'context': '对方心情不好',
                'initial': '你今天看起来不太开心',
                'difficulty': 2
            },
            {
                'category': '制造浪漫',
                'context': '想给对方惊喜',
                'initial': '闭上眼睛，我有东西给你',
                'difficulty': 3
            },
        ]
    
    def generate(self):
        """随机生成场景"""
        return random.choice(self.scenarios)
    
    def generate_batch(self, n):
        """批量生成场景"""
        return [self.generate() for _ in range(n)]

# ======================
# 6. 自我进化系统
# ======================
class SelfEvolution:
    """自我进化系统"""
    
    def __init__(self, model, data_dir):
        self.model = model
        self.data_dir = data_dir
        self.battle_system = BattleSystem(model)
        self.scenario_gen = ScenarioGenerator()
        self.evolution_history = []
    
    def evolve(self, cycles=5):
        """执行进化循环"""
        print("\n" + "="*60)
        print("橄榄子自我进化开始")
        print("="*60)
        
        for cycle in range(cycles):
            print(f"\n--- 进化循环 {cycle + 1}/{cycles} ---")
            
            # 1. 生成场景
            print("1. 生成恋爱场景...")
            scenarios = self.scenario_gen.generate_batch(config.SELF_PLAY_ROUNDS)
            
            # 2. 对抗训练生成数据
            print("2. 对抗训练生成数据...")
            new_data = self.battle_system.generate_training_data(
                scenarios, 
                num_battles=config.SELF_PLAY_ROUNDS
            )
            print(f"   生成高质量数据: {len(new_data)}条")
            
            # 3. 保存数据
            print("3. 保存训练数据...")
            self._save_data(new_data, cycle)
            
            # 4. 训练模型
            print("4. 训练模型...")
            self._train_step(new_data)
            
            # 5. 评估进化
            quality = self._evaluate_evolution()
            print(f"5. 进化评估: {quality:.2%}")
            
            self.evolution_history.append({
                'cycle': cycle,
                'data_count': len(new_data),
                'quality': quality
            })
        
        print("\n" + "="*60)
        print("自我进化完成！")
        print("="*60)
        
        return self.evolution_history
    
    def _save_data(self, data, cycle):
        """保存数据"""
        os.makedirs(self.data_dir, exist_ok=True)
        filepath = os.path.join(self.data_dir, f'evolution_cycle_{cycle}.jsonl')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            for item in data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        
        print(f"   数据已保存: {filepath}")
    
    def _train_step(self, data):
        """训练步骤"""
        if not data:
            return
        
        # 简化训练
        dataset = OliveDataset(data)
        loader = DataLoader(dataset, batch_size=config.BATCH_SIZE, shuffle=True)
        
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=config.LR)
        criterion = nn.CrossEntropyLoss(ignore_index=tokenizer.special_tokens['<pad>'])
        
        self.model.train()
        total_loss = 0
        
        for batch in loader:
            input_ids = batch['input_ids'].to(DEVICE)
            target_ids = batch['target_ids'].to(DEVICE)
            
            logits = self.model(input_ids)
            loss = criterion(
                logits.view(-1, logits.size(-1)),
                target_ids.view(-1)
            )
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        print(f"   训练损失: {total_loss / len(loader):.4f}")
    
    def _evaluate_evolution(self):
        """评估进化效果"""
        # 简单评估：用几个测试对话
        test_cases = [
            "我今天好累",
            "她不回我消息",
            "我想表白"
        ]
        
        total_quality = 0
        for test in test_cases:
            input_ids = torch.tensor([tokenizer.encode(test)], device=DEVICE)
            output = self.model.generate(input_ids, max_new=50)
            response = tokenizer.decode(output[0].tolist())
            
            # 简单质量判断
            if len(response) > 10 and test not in response:
                total_quality += 1
        
        return total_quality / len(test_cases)

# ======================
# 7. 数据集
# ======================
class OliveDataset(Dataset):
    def __init__(self, data):
        self.data = data
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        
        instruction = item.get('instruction', '')
        output = item.get('output', '')
        
        input_tokens = tokenizer.encode(instruction, config.MAX_SEQ_LEN)
        output_tokens = tokenizer.encode(output, config.MAX_SEQ_LEN)
        
        # 拼接
        full_tokens = input_tokens[:-1] + output_tokens
        target_tokens = full_tokens[1:] + [tokenizer.special_tokens['<pad>']]
        
        input_ids = tokenizer.pad(full_tokens, config.MAX_SEQ_LEN)
        target_ids = tokenizer.pad(target_tokens, config.MAX_SEQ_LEN)
        
        return {
            'input_ids': torch.tensor(input_ids, dtype=torch.long),
            'target_ids': torch.tensor(target_ids, dtype=torch.long)
        }

# ======================
# 8. 主函数
# ======================
def main():
    print("="*60)
    print("橄榄子 Olive - 恋爱实战AI教练")
    print("="*60)
    
    # 初始化模型
    model = OliveModel().to(DEVICE)
    
    # 打印信息
    params = sum(p.numel() for p in model.parameters())
    print(f"\n模型参数: {params:,} ({params/1e6:.2f}M)")
    print(f"预估大小: ~{params * 4 / 1024 / 1024:.0f}MB")
    
    # 加载已有数据
    data_dir = "恋爱训练数据"
    all_data = []
    
    # 加载自动生成的数据
    auto_dir = os.path.join(data_dir, "自动生成")
    if os.path.exists(auto_dir):
        for filename in os.listdir(auto_dir):
            if filename.endswith('.jsonl'):
                filepath = os.path.join(auto_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
                            all_data.append(json.loads(line))
    
    print(f"\n加载数据: {len(all_data)}条")
    
    # 初始训练
    if all_data:
        print("\n初始训练...")
        dataset = OliveDataset(all_data)
        loader = DataLoader(dataset, batch_size=config.BATCH_SIZE, shuffle=True)
        
        optimizer = torch.optim.AdamW(model.parameters(), lr=config.LR)
        criterion = nn.CrossEntropyLoss(ignore_index=tokenizer.special_tokens['<pad>'])
        
        model.train()
        for epoch in range(3):
            total_loss = 0
            for batch in loader:
                input_ids = batch['input_ids'].to(DEVICE)
                target_ids = batch['target_ids'].to(DEVICE)
                
                logits = model(input_ids)
                loss = criterion(
                    logits.view(-1, logits.size(-1)),
                    target_ids.view(-1)
                )
                
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                total_loss += loss.item()
            
            print(f"Epoch {epoch+1}: Loss = {total_loss/len(loader):.4f}")
    
    # 自我进化
    print("\n开始自我进化...")
    evolution = SelfEvolution(model, "橄榄子模型/进化数据")
    history = evolution.evolve(cycles=config.EVOLUTION_CYCLES)
    
    # 保存模型
    save_path = "olive_chat.pth"
    torch.save({
        'model_state_dict': model.state_dict(),
        'config': vars(config),
        'evolution_history': history
    }, save_path)
    
    print(f"\n✅ 模型已保存: {save_path}")
    
    # 测试对话
    print("\n--- 测试对话 ---")
    test_inputs = ["我今天好累", "她不回我消息", "我想表白"]
    model.eval()
    
    for test in test_inputs:
        input_ids = torch.tensor([tokenizer.encode(test)], device=DEVICE)
        output = model.generate(input_ids, max_new=50)
        response = tokenizer.decode(output[0].tolist())
        print(f"用户: {test}")
        print(f"橄榄子: {response}\n")

if __name__ == "__main__":
    main()
