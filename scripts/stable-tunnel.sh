#!/bin/bash
# 稳定隧道服务 - 自动重连

LOG_FILE="/tmp/tunnel-service.log"
PID_FILE="/tmp/tunnel-service.pid"

echo "================================================" >> $LOG_FILE
echo "稳定隧道服务启动: $(date)" >> $LOG_FILE
echo "================================================" >> $LOG_FILE

# 主隧道
start_tunnel() {
    echo "[$(date)] 启动隧道..." >> $LOG_FILE
    
    # 停止旧的
    pkill -f localtunnel 2>/dev/null
    sleep 2
    
    # 启动新的
    npx localtunnel --port 3000 --subdomain love-agent-ai >> $LOG_FILE 2>&1 &
    echo $! > /tmp/lt.pid
    
    echo "[$(date)] 隧道已启动: https://love-agent-ai.loca.lt" >> $LOG_FILE
}

# 检查隧道是否存活
check_tunnel() {
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://love-agent-ai.loca.lt" --max-time 10 2>/dev/null)
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "000" ]; then
        return 0  # 正常
    else
        return 1  # 需要重启
    fi
}

# 主循环
while true; do
    if ! check_tunnel; then
        echo "[$(date)] 隧道断开，正在重连..." >> $LOG_FILE
        start_tunnel
        sleep 10
    fi
    sleep 30
done
