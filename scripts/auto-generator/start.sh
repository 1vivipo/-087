#!/bin/bash
# 启动自动数据生成

cd /home/z/my-project

echo "启动自动数据生成系统..."
nohup python3 scripts/auto-generator/generate_data.py > /tmp/auto-generator.log 2>&1 &

echo "已启动，PID: $!"
echo "日志文件: /tmp/auto-generator.log"
