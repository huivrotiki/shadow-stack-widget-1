#!/bin/bash
# 0.foundation.scan.sh
echo "[foundation.scan] Starting Reality Scan..."
echo "OS: $(sw_vers -productName) $(sw_vers -productVersion)"
echo "Arch: $(uname -m)"
echo "Model: $(sysctl -n hw.model)"

# Check for essential tools
TOOLS=("node" "npm" "git" "brew" "doppler" "ollama")
for tool in "${TOOLS[@]}"; do
    if command -v $tool >/dev/null 2>&1; then
        echo "✅ $tool: $(which $tool) ($($tool --version 2>/dev/null | head -n 1))"
    else
        echo "❌ $tool: NOT FOUND"
    fi
done

echo "[foundation.scan] Factor 12 Performance check:"
echo "Memory: $(top -l 1 | grep PhysMem | cut -d ' ' -f 2-)"
echo "Disk: $(df -h / | tail -1 | awk '{print $4 " free"}')"

echo "[foundation.scan] done."
