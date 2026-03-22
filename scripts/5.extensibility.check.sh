#!/bin/bash
# 5.extensibility.check.sh
echo "[extensibility.check] Validating orchestrator extensibility..."
SCRIPTS_COUNT=$(ls scripts/*.sh | wc -l)
echo "✅ Total orchestration scripts: $SCRIPTS_COUNT"
echo "Check main.cjs for dynamic routing..."
if grep -q "switch (taskId)" /Users/work/shadow-stack-widget/main.cjs; then
    echo "✅ Task routing is centralized in main.cjs switch statement."
else
    echo "⚠️ Task routing should be improved for scalability."
fi
echo "[extensibility.check] done."
