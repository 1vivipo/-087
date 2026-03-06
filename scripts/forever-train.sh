#!/bin/bash
# 永久训练脚本 - 永远不停

while true; do
    cd /home/z/my-project
    
    # 检查训练是否运行
    if ! pgrep -f enhanced-trainer > /dev/null; then
        echo "[$(date)] 重启训练..." >> /tmp/train.log
        node scripts/enhanced-trainer.js >> /tmp/enhanced-trainer.log 2>&1 &
    fi
    
    # 检查应用是否运行
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "[$(date)] 应用异常!" >> /tmp/train.log
    fi
    
    sleep 60
done
