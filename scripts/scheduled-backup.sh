#!/bin/bash
# 定时备份脚本 - 每天12点执行

cd /home/z/my-project

while true; do
    HOUR=$(date +%H)
    MINUTE=$(date +%M)
    
    # 每天12点执行备份
    if [ "$HOUR" = "12" ] && [ "$MINUTE" = "00" ]; then
        echo "========================================" >> /tmp/backup.log
        echo "开始每日备份: $(date)" >> /tmp/backup.log
        
        # 执行备份脚本
        /home/z/my-project/scripts/daily-backup.sh >> /tmp/backup.log 2>&1
        
        echo "备份完成: $(date)" >> /tmp/backup.log
        
        # 等待一分钟避免重复执行
        sleep 60
    fi
    
    # 每分钟检查一次
    sleep 60
done
