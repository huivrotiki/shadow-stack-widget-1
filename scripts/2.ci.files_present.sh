#!/bin/bash
# 2.ci.files_present.sh
echo "[ci.files_present] Checking CI/CD workflows..."
if [ -d ".github/workflows" ]; then
    echo "✅ GitHub Actions workflows directory found."
    ls -l .github/workflows
else
    echo "❌ No .github/workflows folder found."
fi
echo "[ci.files_present] done."
