#!/bin/bash
# 4.logs.format.sh
echo "[logs.format] Checking orchestrator log consistency..."
LOG_FILE="/tmp/shadow-widget.log"
if [ -f "$LOG_FILE" ]; then
    echo "✅ Log file found at $LOG_FILE"
    echo "Last 5 entries:"
    tail -n 5 "$LOG_FILE"
else
    echo "⚠️ No log file found yet at $LOG_FILE. This is expected if the app hasn't run."
fi
echo "[logs.format] Checking IPC log structure in main.cjs..."
if grep -q "orchestrator:log" /Users/work/shadow-stack-widget/main.cjs; then
    echo "✅ IPC log channel 'orchestrator:log' defined."
else
    echo "❌ Missing 'orchestrator:log' in main.cjs."
fi
echo "[logs.format] done."
