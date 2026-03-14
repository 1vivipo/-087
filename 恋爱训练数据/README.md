# 恋爱训练数据

## 📁 目录结构

```
恋爱训练数据/
├── 对话数据/
│   ├── 场景对话.jsonl      # 场景化对话训练数据
│   └── 日常对话.jsonl      # 日常对话训练数据
├── 知识库数据/
│   ├── communication.jsonl # 沟通心理学
│   ├── relationship.jsonl  # 关系心理学
│   ├── dating.jsonl        # 恋爱技巧
│   ├── behavior.jsonl      # 行为学知识
│   ├── psychology.jsonl    # 心理学原理
│   └── advancedPsychology.jsonl # 进阶心理学
├── 书籍数据/
│   └── 书籍训练数据.jsonl  # 书籍内容训练数据
├── 训练脚本/
│   ├── train_lora.py       # LoRA 微调脚本
│   └── inference.py        # 推理脚本
└── README.md               # 本文件
```

## 📊 数据统计

| 类别 | 数量 |
|------|------|
| 对话数据 | 77条 |
| 知识库数据 | 6,195条 |
| 书籍数据 | 若干 |
| **总计** | **6,000+条** |

## 🚀 使用方法

### 1. 安装依赖

```bash
pip install torch transformers peft datasets accelerate
```

### 2. 运行训练

```bash
python 恋爱训练数据/训练脚本/train_lora.py
```

### 3. 使用模型

```bash
python 恋爱训练数据/训练脚本/inference.py
```

## ⚙️ 训练要求

- GPU: 建议 16GB+ 显存
- 时间: 约 2-8 小时
- 成本: 约 50-200 元（云端 GPU）

## 💡 推荐平台

- AutoDL (便宜)
- 阿里云 PAI
- Google Colab Pro
- Hugging Face Spaces
