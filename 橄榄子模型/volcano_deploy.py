#!/usr/bin/env python3
"""
火山平台部署脚本
用于在火山引擎上训练和部署橄榄子模型
"""

import os
import json

# 火山平台配置
VOLCANO_CONFIG = {
    "model_name": "olive-chat",
    "framework": "pytorch",
    "python_version": "3.10",
    "requirements": [
        "torch>=2.0.0",
        "transformers>=4.30.0",
    ],
    "train_script": "olive_model.py",
    "model_path": "olive_chat.pth",
    "data_path": "恋爱训练数据/"
}

def create_volcano_config():
    """创建火山平台配置文件"""
    config = {
        "name": VOLCANO_CONFIG["model_name"],
        "description": "橄榄子 - 恋爱实战AI教练",
        "framework": VOLCANO_CONFIG["framework"],
        "python": VOLCANO_CONFIG["python_version"],
        "requirements": VOLCANO_CONFIG["requirements"],
        "entry_point": "olive_model.py:main",
        "model_artifacts": ["olive_chat.pth"],
        "data_files": ["恋爱训练数据/"]
    }
    
    with open("volcano_config.json", 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ 火山平台配置已创建: volcano_config.json")

def create_requirements():
    """创建 requirements.txt"""
    requirements = [
        "torch>=2.0.0",
        "transformers>=4.30.0",
        "numpy>=1.24.0",
    ]
    
    with open("requirements.txt", 'w') as f:
        f.write('\n'.join(requirements))
    
    print("✅ requirements.txt 已创建")

def create_dockerfile():
    """创建 Dockerfile"""
    dockerfile = '''
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY olive_model.py .
COPY 恋爱训练数据/ ./恋爱训练数据/

CMD ["python", "olive_model.py"]
'''
    
    with open("Dockerfile", 'w') as f:
        f.write(dockerfile.strip())
    
    print("✅ Dockerfile 已创建")

def main():
    print("="*60)
    print("火山平台部署准备")
    print("="*60)
    
    create_volcano_config()
    create_requirements()
    create_dockerfile()
    
    print("\n部署步骤:")
    print("1. 将整个 橄榄子模型 文件夹上传到火山平台")
    print("2. 选择 GPU 实例（推荐 T4 或 A10）")
    print("3. 运行训练脚本")
    print("4. 训练完成后导出模型")
    print("5. 部署为 API 服务")

if __name__ == "__main__":
    main()
