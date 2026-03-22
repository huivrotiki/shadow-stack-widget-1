#!/bin/bash
# 0.mac.bootstrap.xcode.sh
echo "[mac.bootstrap.xcode] Checking Xcode Command Line Tools..."
if xcode-select -p >/dev/null 2>&1; then
    echo "✅ Xcode Command Line Tools already installed at $(xcode-select -p)"
else
    echo "🔄 Triggering Xcode Command Line Tools installation..."
    xcode-select --install
    echo "⚠️ Installation window should be open. Complete it and run this task again."
fi
echo "[mac.bootstrap.xcode] done."
