#!/bin/bash
# 自动同步数据到 GitHub
# 每小时执行一次

cd /home/z/my-project

# 配置 git
git config user.email "1vivipo@users.noreply.github.com"
git config user.name "1vivipo"

# 添加自动生成的数据
git add 恋爱训练数据/自动生成/

# 提交
DATE=$(date '+%Y-%m-%d %H:%M')
git commit -m "自动同步训练数据 - $DATE" 2>/dev/null

# 推送
git push origin master:main 2>/dev/null

echo "[$(date)] 已同步到 GitHub" >> /tmp/github_sync.log
