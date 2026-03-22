#!/bin/bash
# 1.node.install_deps.sh
echo "[node.install_deps] Installing/auditing Node.js dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully."
    echo "🔄 Running npm audit..."
    npm audit --audit-level=high
else
    echo "❌ Failed to install dependencies."
    exit 1
fi
echo "[node.install_deps] done."
