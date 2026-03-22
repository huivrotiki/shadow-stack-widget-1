#!/bin/bash
# 0.mac.bootstrap.brew.sh
echo "[mac.bootstrap.brew] Checking Homebrew..."
if command -v brew >/dev/null 2>&1; then
    echo "✅ Homebrew already installed: $(brew --version | head -n 1)"
    echo "🔄 Updating Homebrew..."
    brew update
else
    echo "🔄 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
echo "[mac.bootstrap.brew] done."
