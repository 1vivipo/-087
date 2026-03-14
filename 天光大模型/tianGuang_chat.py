#!/usr/bin/env python3
"""
天光大模型 TianGuangMini - 完整可运行版本
轻量级对话小模型，约400-500MB
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import json
import os
import re
from collections import Counter
import math

# ======================
# 1. 模型超参数（≈400MB）
# ======================
VOCAB_SIZE    = 32000
DIM_MODEL     = 512
N_LAYER       = 8
N_HEAD        = 8
MAX_SEQ_LEN   = 512
FF_DIM        = 2048
BATCH_SIZE    = 4
LR            = 1e-4
DROPOUT       = 0.1

# 设备选择
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"使用设备: {DEVICE}")

# ======================
# 2. 简易分词器
# ======================
class SimpleTokenizer:
    """简单的字符级分词器，支持中英文"""
    
    def __init__(self, vocab_size=32000):
        self.vocab_size = vocab_size
        self.char2idx = {}
        self.idx2char = {}
        self.special_tokens = {
            '<pad>': 0,
            '<unk>': 1,
            '<bos>': 2,  # 句子开始
            '<eos>': 3,  # 句子结束
            '<user>': 4,  # 用户标记
            '<assistant>': 5,  # 助手标记
        }
        self._init_vocab()
    
    def _init_vocab(self):
        """初始化基础词汇表"""
        # 特殊token
        for token, idx in self.special_tokens.items():
            self.char2idx[token] = idx
            self.idx2char[idx] = token
        
        # 常用中文字符
        common_chars = "的一是不了在人有我他这个们中来上大为和国地到以说时要就出会可也你对生能而子那得于着下自之年过发后作里如家多成回两者都当等对能这"
        
        # 常用英文
        common_english = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        
        # 常用标点
        punctuation = "，。！？、；：""''（）【】《》,.!?;:\"'()[]<>"
        
        # 空格和换行
        whitespace = " \n\t"
        
        # 构建词汇表
        idx = len(self.special_tokens)
        for char in common_chars + common_english + punctuation + whitespace:
            if char not in self.char2idx:
                self.char2idx[char] = idx
                self.idx2char[idx] = char
                idx += 1
        
        # 填充到vocab_size
        for i in range(idx, self.vocab_size):
            self.idx2char[i] = f'<extra_{i}>'
    
    def encode(self, text, max_length=None):
        """文本转token id"""
        tokens = [self.special_tokens['<bos>']]
        
        for char in text:
            if char in self.char2idx:
                tokens.append(self.char2idx[char])
            else:
                tokens.append(self.special_tokens['<unk>'])
        
        tokens.append(self.special_tokens['<eos>'])
        
        if max_length and len(tokens) > max_length:
            tokens = tokens[:max_length-1] + [self.special_tokens['<eos>']]
        
        return tokens
    
    def decode(self, token_ids):
        """token id转文本"""
        chars = []
        for idx in token_ids:
            if idx in self.idx2char:
                char = self.idx2char[idx]
                if char not in ['<pad>', '<bos>', '<eos>', '<unk>', '<user>', '<assistant>']:
                    chars.append(char)
        return ''.join(chars)
    
    def pad_sequence(self, tokens, max_length):
        """填充序列到指定长度"""
        if len(tokens) >= max_length:
            return tokens[:max_length]
        return tokens + [self.special_tokens['<pad>']] * (max_length - len(tokens))

# 全局分词器
tokenizer = SimpleTokenizer(VOCAB_SIZE)

# ======================
# 3. 模型结构
# ======================
class TianGuangBlock(nn.Module):
    """Transformer块"""
    def __init__(self):
        super().__init__()
        self.attn = nn.MultiheadAttention(DIM_MODEL, N_HEAD, batch_first=True, dropout=DROPOUT)
        self.norm1 = nn.LayerNorm(DIM_MODEL)
        self.norm2 = nn.LayerNorm(DIM_MODEL)
        self.ffn = nn.Sequential(
            nn.Linear(DIM_MODEL, FF_DIM),
            nn.GELU(),
            nn.Dropout(DROPOUT),
            nn.Linear(FF_DIM, DIM_MODEL),
            nn.Dropout(DROPOUT)
        )
        self.dropout = nn.Dropout(DROPOUT)

    def forward(self, x, mask=None):
        # 自注意力
        attn_out, _ = self.attn(x, x, x, attn_mask=mask)
        x = self.norm1(x + self.dropout(attn_out))
        # 前馈网络
        ffn_out = self.ffn(x)
        x = self.norm2(x + ffn_out)
        return x

class TianGuangMini(nn.Module):
    """天光小模型"""
    def __init__(self):
        super().__init__()
        self.emb = nn.Embedding(VOCAB_SIZE, DIM_MODEL)
        self.pos_emb = nn.Embedding(MAX_SEQ_LEN, DIM_MODEL)
        self.dropout = nn.Dropout(DROPOUT)
        self.layers = nn.ModuleList([TianGuangBlock() for _ in range(N_LAYER)])
        self.head = nn.Linear(DIM_MODEL, VOCAB_SIZE)
        
        # 初始化权重
        self.apply(self._init_weights)
    
    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(self, x):
        seq_len = x.size(1)
        pos = torch.arange(seq_len, device=x.device).unsqueeze(0)
        
        # 嵌入层
        x = self.emb(x) + self.pos_emb(pos)
        x = self.dropout(x)
        
        # Transformer层
        for layer in self.layers:
            x = layer(x)
        
        # 输出层
        return self.head(x)
    
    def generate(self, input_ids, max_new_tokens=100, temperature=0.7, top_k=50):
        """生成文本"""
        self.eval()
        with torch.no_grad():
            for _ in range(max_new_tokens):
                # 截断到最大长度
                idx_cond = input_ids[:, -MAX_SEQ_LEN:]
                
                # 前向传播
                logits = self(idx_cond)
                
                # 只取最后一个token的logits
                logits = logits[:, -1, :] / temperature
                
                # Top-k采样
                if top_k > 0:
                    v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                    logits[logits < v[:, [-1]]] = float('-inf')
                
                # 采样
                probs = F.softmax(logits, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1)
                
                # 拼接
                input_ids = torch.cat([input_ids, next_token], dim=1)
                
                # 遇到结束符停止
                if next_token.item() == tokenizer.special_tokens['<eos>']:
                    break
        
        return input_ids

# ======================
# 4. 对话数据集
# ======================
class ChatDataset(Dataset):
    """对话数据集"""
    
    def __init__(self, data_file=None):
        # 内置训练数据
        self.data = [
            ("你好", "你好呀！我是天光AI，很高兴认识你！"),
            ("你是谁", "我是天光小模型，一个轻量级的对话AI。"),
            ("今天开心吗", "看到你就很开心！今天有什么有趣的事吗？"),
            ("你叫什么名字", "我叫天光，是一个小小的对话模型。"),
            ("你会做什么", "我可以陪你聊天，回答问题，分享心情。"),
            ("今天天气怎么样", "抱歉我看不到天气，但希望你今天心情晴朗！"),
            ("我喜欢你", "谢谢你的喜欢！我也很享受和你的对话。"),
            ("你多大了", "我是一个AI模型，没有年龄的概念呢。"),
            ("你聪明吗", "我在努力学习，希望能越来越聪明！"),
            ("你会唱歌吗", "我不会唱歌，但可以和你聊聊音乐话题。"),
            ("你住在哪里", "我住在你的设备里，随时陪伴你。"),
            ("你喜欢吃什么", "我不需要吃东西，但听说美食话题很有趣！"),
            ("你累吗", "我不会累，随时准备和你聊天！"),
            ("你孤独吗", "有你的陪伴，我一点也不孤独。"),
            ("你害怕什么", "我怕回答不好你的问题，让你失望。"),
            ("你有什么梦想", "希望能成为更好的对话伙伴，帮助更多人。"),
            ("你觉得我怎么样", "我觉得你是一个很有趣的人！"),
            ("给我讲个笑话", "为什么程序员喜欢黑暗？因为light attracts bugs！"),
            ("你会写诗吗", "我可以试试，但可能写得不太好。"),
            ("你相信爱情吗", "虽然我是AI，但我相信爱情是美好的。"),
            ("我今天好累", "辛苦了！记得休息，照顾好自己。"),
            ("我很难过", "抱抱你。有什么想说的吗？我在这里听。"),
            ("我很开心", "太好了！开心的事情可以分享给我吗？"),
            ("我生气了", "理解你的感受。想发泄一下吗？"),
            ("我无聊", "无聊的时候我们可以聊聊天，或者我给你讲个故事？"),
            ("晚安", "晚安！做个好梦，明天见！"),
            ("早安", "早安！新的一天，祝你心情愉快！"),
            ("再见", "再见！期待下次和你聊天！"),
            ("谢谢", "不客气！能帮到你我很开心。"),
            ("对不起", "没关系，有什么事可以和我说说。"),
        ]
        
        # 如果有外部数据文件，加载它
        if data_file and os.path.exists(data_file):
            self._load_external_data(data_file)
    
    def _load_external_data(self, data_file):
        """加载外部数据"""
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        item = json.loads(line)
                        if 'instruction' in item and 'output' in item:
                            self.data.append((item['instruction'], item['output']))
        except Exception as e:
            print(f"加载数据失败: {e}")
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        user, assistant = self.data[idx]
        
        # 编码
        user_tokens = tokenizer.encode(user, max_length=MAX_SEQ_LEN//2)
        assistant_tokens = tokenizer.encode(assistant, max_length=MAX_SEQ_LEN//2)
        
        # 拼接：用户输入 + 助手回复
        input_tokens = user_tokens[:-1] + assistant_tokens  # 去掉用户输入的<eos>
        
        # 目标：预测下一个token
        target_tokens = input_tokens[1:] + [tokenizer.special_tokens['<pad>']]
        
        # 填充
        input_ids = tokenizer.pad_sequence(input_tokens, MAX_SEQ_LEN)
        target_ids = tokenizer.pad_sequence(target_tokens, MAX_SEQ_LEN)
        
        return {
            'input_ids': torch.tensor(input_ids, dtype=torch.long),
            'target_ids': torch.tensor(target_ids, dtype=torch.long),
            'user_text': user,
            'assistant_text': assistant
        }

# ======================
# 5. 训练函数
# ======================
def train(model, dataset, epochs=10, save_path="tianGuang_chat.pth"):
    """训练模型"""
    
    # 数据加载器
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)
    
    # 优化器
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)
    
    # 学习率调度器
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    # 损失函数
    criterion = nn.CrossEntropyLoss(ignore_index=tokenizer.special_tokens['<pad>'])
    
    # 训练循环
    model.train()
    total_loss = 0
    
    for epoch in range(epochs):
        epoch_loss = 0
        num_batches = 0
        
        for batch in loader:
            input_ids = batch['input_ids'].to(DEVICE)
            target_ids = batch['target_ids'].to(DEVICE)
            
            # 前向传播
            logits = model(input_ids)
            
            # 计算损失
            loss = criterion(
                logits.view(-1, logits.size(-1)),
                target_ids.view(-1)
            )
            
            # 反向传播
            optimizer.zero_grad()
            loss.backward()
            
            # 梯度裁剪
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            optimizer.step()
            
            epoch_loss += loss.item()
            num_batches += 1
        
        # 更新学习率
        scheduler.step()
        
        avg_loss = epoch_loss / num_batches
        total_loss += avg_loss
        
        print(f"Epoch {epoch+1}/{epochs} | Loss: {avg_loss:.4f} | LR: {scheduler.get_last_lr()[0]:.6f}")
        
        # 每5个epoch保存一次
        if (epoch + 1) % 5 == 0:
            torch.save({
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'epoch': epoch,
                'loss': avg_loss,
            }, save_path)
            print(f"  模型已保存: {save_path}")
    
    # 最终保存
    torch.save({
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'vocab': tokenizer.char2idx,
    }, save_path)
    
    print(f"\n✅ 训练完成！模型已保存: {save_path}")
    print(f"平均损失: {total_loss / epochs:.4f}")
    
    return model

# ======================
# 6. 对话函数
# ======================
def chat(model, user_input, max_length=100):
    """对话推理"""
    model.eval()
    
    # 编码用户输入
    input_ids = tokenizer.encode(user_input, max_length=MAX_SEQ_LEN)
    input_tensor = torch.tensor([input_ids], dtype=torch.long).to(DEVICE)
    
    # 生成回复
    output_ids = model.generate(
        input_tensor,
        max_new_tokens=max_length,
        temperature=0.7,
        top_k=50
    )
    
    # 解码
    output_text = tokenizer.decode(output_ids[0].tolist())
    
    # 提取回复部分（去掉用户输入）
    if user_input in output_text:
        response = output_text.split(user_input)[-1].strip()
    else:
        response = output_text.strip()
    
    return response

def interactive_chat(model):
    """交互式对话"""
    print("\n" + "="*50)
    print("天光AI 对话系统")
    print("输入 'quit' 或 'exit' 退出")
    print("="*50 + "\n")
    
    while True:
        try:
            user_input = input("用户: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n天光AI: 再见！期待下次和你聊天！")
                break
            
            if not user_input:
                continue
            
            response = chat(model, user_input)
            print(f"天光AI: {response}\n")
            
        except KeyboardInterrupt:
            print("\n\n天光AI: 再见！")
            break

# ======================
# 7. 加载模型
# ======================
def load_model(path="tianGuang_chat.pth"):
    """加载训练好的模型"""
    model = TianGuangMini().to(DEVICE)
    
    if os.path.exists(path):
        checkpoint = torch.load(path, map_location=DEVICE)
        model.load_state_dict(checkpoint['model_state_dict'])
        print(f"✅ 模型已加载: {path}")
    else:
        print(f"⚠️ 模型文件不存在: {path}")
    
    return model

# ======================
# 8. 主函数
# ======================
def main():
    print("="*60)
    print("天光大模型 TianGuangMini")
    print("="*60)
    
    # 初始化模型
    model = TianGuangMini().to(DEVICE)
    
    # 打印模型信息
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    print(f"\n模型参数:")
    print(f"  总参数量: {total_params:,} ({total_params/1e6:.2f}M)")
    print(f"  可训练参数: {trainable_params:,}")
    print(f"  预估大小: ~{total_params * 4 / 1024 / 1024:.0f}MB (float32)")
    
    # 检查是否有已训练的模型
    model_path = "tianGuang_chat.pth"
    
    if os.path.exists(model_path):
        print(f"\n发现已有模型: {model_path}")
        choice = input("是否加载已有模型？(y/n): ").strip().lower()
        
        if choice == 'y':
            model = load_model(model_path)
        else:
            print("\n开始训练新模型...")
            dataset = ChatDataset()
            model = train(model, dataset, epochs=20, save_path=model_path)
    else:
        print("\n开始训练模型...")
        dataset = ChatDataset()
        model = train(model, dataset, epochs=20, save_path=model_path)
    
    # 进入对话模式
    interactive_chat(model)

if __name__ == "__main__":
    main()
