#!/bin/bash

# 监控脚本 - 确保所有服务持续运行

LOG="/tmp/monitor.log"

echo "========================================" >> $LOG
echo "监控服务启动: $(date)" >> $LOG
echo "========================================" >> $LOG

while true; do
    # 检查训练脚本
    if ! pgrep -f "enhanced-trainer" > /dev/null; then
        echo "[$(date)] 训练脚本已停止，重启中..." >> $LOG
        cd /home/z/my-project
        node scripts/enhanced-trainer.js >> /tmp/enhanced-trainer.log 2>&1 &
    fi
    
    # 检查隧道
    if ! pgrep -f localtunnel > /dev/null; then
        echo "[$(date)] 隧道已停止，重启中..." >> $LOG
        npx localtunnel --port 3000 --subdomain love-agent-ai >> /tmp/lt.log 2>&1 &
    fi
    
    # 检查应用
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "[$(date)] 应用无响应!" >> $LOG
    fi
    
    sleep 60
done
