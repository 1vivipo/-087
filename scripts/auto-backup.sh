#!/bin/bash
# 自动备份脚本 - 每小时备份一次

BACKUP_DIR="/home/z/my-project/backups"
DATA_DIR="/home/z/my-project/data"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR/daily
mkdir -p $BACKUP_DIR/hourly

# 备份所有数据
cp $DATA_DIR/knowledge-base.json $BACKUP_DIR/hourly/knowledge-base_$DATE.json
cp $DATA_DIR/siren-system.json $BACKUP_DIR/hourly/siren-system_$DATE.json
cp $DATA_DIR/swarm-system.json $BACKUP_DIR/hourly/swarm-system_$DATE.json
cp $DATA_DIR/autonomous-training.json $BACKUP_DIR/hourly/autonomous-training_$DATE.json
cp -r $DATA_DIR/books $BACKUP_DIR/hourly/books_$DATE

# 创建完整备份
cd /home/z/my-project
tar -czvf $BACKUP_DIR/hourly/full_backup_$DATE.tar.gz data/ 2>/dev/null

# 只保留最近24小时的备份
find $BACKUP_DIR/hourly -name "*.json" -mtime +1 -delete 2>/dev/null
find $BACKUP_DIR/hourly -name "*.tar.gz" -mtime +1 -delete 2>/dev/null
find $BACKUP_DIR/hourly -type d -name "books_*" -mtime +1 -exec rm -rf {} \; 2>/dev/null

# 每天创建一个永久备份
HOUR=$(date +%H)
if [ "$HOUR" = "00" ]; then
    cp $BACKUP_DIR/hourly/full_backup_$DATE.tar.gz $BACKUP_DIR/daily/
    echo "[$(date)] 每日备份已创建" >> $BACKUP_DIR/backup.log
fi

echo "[$(date)] 备份完成" >> $BACKUP_DIR/backup.log
