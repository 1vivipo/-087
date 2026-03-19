#!/bin/bash
# 每日自动备份脚本 - 每天12点执行

cd /home/z/my-project

echo "========================================" >> /tmp/backup.log
echo "开始备份: $(date)" >> /tmp/backup.log

# 1. 创建本地备份
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/daily
tar -czvf backups/daily/backup_$DATE.tar.gz data/ 2>/dev/null

# 2. 同步数据到 Supabase
python3 << 'PYTHON'
import json
import urllib.request

SUPABASE_URL = "https://hhmgmjdxoyixxvlewinh.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhobWdtamR4b3lpeHh2bGV3aW5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc1MTY5MCwiZXhwIjoyMDg4MzI3NjkwfQ.CVSzsX16rm4H7XgXj8_n_HN2J4cGc2Rxgo4JcoNc_zg"

try:
    # 读取知识库
    with open('/home/z/my-project/data/knowledge-base.json', 'r') as f:
        data = json.load(f)
    items = data.get('items', [])
    
    # 上传新数据
    for item in items[-100:]:  # 只上传最新的100条
        record = {
            'id': item.get('id', ''),
            'title': str(item.get('title', ''))[:500],
            'content': str(item.get('content', ''))[:10000],
            'source': str(item.get('source', 'local'))[:100],
            'category': str(item.get('category', '未分类'))[:100],
            'tags': item.get('tags', [])[:10]
        }
        
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/knowledge_items?on_conflict=id",
            data=json.dumps(record).encode('utf-8'),
            headers={
                'apikey': SUPABASE_KEY,
                'Authorization': f'Bearer {SUPABASE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal,resolution=merge-duplicates'
            },
            method='POST'
        )
        urllib.request.urlopen(req, timeout=10)
    
    print(f"同步完成: {len(items)}条知识")
except Exception as e:
    print(f"同步失败: {e}")
PYTHON

# 3. 推送到 GitHub
git add data/ backups/ docs/ 2>/dev/null
git commit -m "每日自动备份 - $(date '+%Y-%m-%d %H:%M')" 2>/dev/null
git push origin master:main 2>/dev/null

echo "备份完成: $(date)" >> /tmp/backup.log
