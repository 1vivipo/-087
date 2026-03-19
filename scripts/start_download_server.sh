#!/bin/bash
# 启动临时HTTP下载服务

PORT=8080
DATA_DIR="/home/z/my-project/恋爱训练数据/生成数据"

cd $DATA_DIR

echo "=== 启动下载服务 ==="
echo "端口: $PORT"
echo "目录: $DATA_DIR"
echo ""
echo "下载链接:"
echo "  http://$(hostname -I | awk '{print $1}'):$PORT/"
echo ""
echo "文件列表:"
ls -lh *.gz 2>/dev/null | while read line; do
    file=$(echo $line | awk '{print $NF}')
    echo "  http://$(hostname -I | awk '{print $1}'):$PORT/$file"
done

echo ""
echo "按Ctrl+C停止服务"
echo ""

python3 -m http.server $PORT
