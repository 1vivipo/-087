#!/bin/bash
# 每小时自动同步

while true; do
    HOUR=$(date +%H)
    
    # 每小时整点执行
    if [ $(date +%M) = "00" ]; then
        echo "[$(date)] 开始同步到 GitHub..." >> /tmp/github_sync.log
        /home/z/my-project/scripts/auto_sync_github.sh
        sleep 60  # 等待一分钟避免重复
    fi
    
    sleep 60
done
