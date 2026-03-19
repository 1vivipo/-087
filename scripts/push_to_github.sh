#!/bin/bash
# GitHub分批推送脚本

REPO_DIR="/home/z/my-project"
DATA_DIR="恋爱训练数据/生成数据"
MAX_SIZE=50000000  # 50MB

cd $REPO_DIR

echo "=== GitHub分批推送 ==="

# 检查文件大小
check_size() {
    local file=$1
    local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    echo $size
}

# 推送单个文件
push_file() {
    local file=$1
    local size=$(check_size "$file")
    
    if [ $size -gt $MAX_SIZE ]; then
        echo "文件过大，跳过: $file ($size bytes)"
        return 1
    fi
    
    echo "推送: $file"
    git add "$file"
    git commit -m "添加数据文件: $(basename $file)"
    git push origin master:main
    
    # 等待避免触发限制
    sleep 5
}

# 批量推送
push_batch() {
    local files=$1
    local batch_num=$2
    
    echo "=== 批次 $batch_num ==="
    
    git add $files
    git commit -m "数据批次 $batch_num"
    git push origin master:main
    
    sleep 10
}

# 主流程
main() {
    local batch_num=1
    local current_size=0
    local current_files=""
    
    for file in $DATA_DIR/*.gz; do
        if [ -f "$file" ]; then
            local size=$(check_size "$file")
            
            if [ $((current_size + size)) -gt $MAX_SIZE ]; then
                # 推送当前批次
                if [ -n "$current_files" ]; then
                    push_batch "$current_files" $batch_num
                    batch_num=$((batch_num + 1))
                    current_size=0
                    current_files=""
                fi
            fi
            
            current_size=$((current_size + size))
            current_files="$current_files $file"
        fi
    done
    
    # 推送最后一批
    if [ -n "$current_files" ]; then
        push_batch "$current_files" $batch_num
    fi
    
    echo "=== 推送完成 ==="
}

main
