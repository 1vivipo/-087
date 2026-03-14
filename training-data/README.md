# 恋爱追女生智能体 - 大模型训练指南

## 📊 训练数据统计

| 数据类型 | 数量 | 文件 |
|---------|------|------|
| 知识库训练数据 | 18,585条 | knowledge_train.jsonl |
| 对话训练数据 | 503条 | dialogue_train.jsonl |
| **总计** | **19,088条** | love_agent_train.jsonl |

## 🚀 快速开始

### 方案一：使用 LoRA 微调（推荐）

```bash
# 1. 安装依赖
pip install torch transformers peft datasets accelerate

# 2. 运行微调
python training-data/train_lora.py

# 3. 使用模型
python training-data/inference.py
```

### 方案二：使用在线平台训练

1. **Google Colab** (免费 GPU)
   - 上传 `love_agent_train.jsonl`
   - 运行微调脚本

2. **AutoTrain Advanced**
   ```bash
   autotrain llm --train --model Qwen/Qwen2-7B-Instruct --data-path training-data --lr 2e-5 --epochs 3
   ```

3. **LLaMA-Factory**
   - Web UI 界面
   - 支持多种模型

## 📁 文件说明

```
training-data/
├── love_agent_train.jsonl    # 完整训练数据 (19,088条)
├── knowledge_train.jsonl     # 知识库数据 (18,585条)
├── dialogue_train.jsonl      # 对话数据 (503条)
├── model_config.json         # 模型配置
├── train_lora.py            # LoRA 微调脚本
├── inference.py             # 推理脚本
└── README.md                # 本文件
```

## 🔧 数据格式

Alpaca 格式：
```json
{
    "instruction": "请详细解释【沟通心理学】话术设计",
    "input": "",
    "output": "话术设计是沟通心理学的重要组成部分..."
}
```

## 💡 推荐基础模型

| 模型 | 大小 | 说明 |
|------|------|------|
| Qwen2-7B-Instruct | 7B | 推荐，中文能力强 |
| Llama3-8B-Instruct | 8B | 英文能力强 |
| Mistral-7B-Instruct | 7B | 平衡性能 |
| ChatGLM3-6B | 6B | 中文优化 |

## 📝 训练参数建议

```python
{
    "num_train_epochs": 3,
    "per_device_train_batch_size": 4,
    "learning_rate": 2e-5,
    "lora_r": 16,
    "lora_alpha": 32,
    "max_seq_length": 2048
}
```

## 🎯 预期效果

训练后的模型将能够：
- 回答恋爱相关问题
- 提供心理学建议
- 给出沟通技巧指导
- 分析恋爱场景

## ⚠️ 注意事项

1. 需要 GPU 资源（建议 16GB+ 显存）
2. 训练时间约 2-4 小时
3. 建议使用 LoRA 微调节省资源
