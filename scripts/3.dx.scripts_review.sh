#!/bin/bash
# 3.dx.scripts_review.sh
echo "[dx.scripts_review] Checking package.json scripts..."
if [ -f "package.json" ]; then
    grep '"scripts":' -A 10 package.json
    echo "✅ Scripts found. Expected 'dev' and 'build' to be present."
else
    echo "❌ Missing package.json."
fi
echo "[dx.scripts_review] done."
