#!/bin/bash
# 5.docs.runbook.sh
echo "[docs.runbook] Verifying documentation integrity..."
FILES=("README.md" "PHASES.md" "TRACKING.md" "hd/SHADOW_STACK_CANVAS.md" "hd/SECRETS.md")
for f in "${FILES[@]}"; do
    if [ -f "$f" ]; then
        echo "✅ $f exists."
    else
        echo "❌ Missing CRITICAL doc: $f"
    fi
done

if [ -f "RUNBOOK.md" ]; then
    echo "✅ RUNBOOK.md found."
else
    echo "🔄 Creating RUNBOOK.md template..."
    cat <<EOF > RUNBOOK.md
# Shadow Stack Runbook v3.1.2

## Quick Start
1. Install Doppler CLI.
2. Run \`doppler setup\`.
3. Start Dev: \`doppler run -- npm run dev\`.
4. Start API: \`doppler run -- npm run api\`.

## Orchestration
Use the Bootstrap tab in the UI or run \`npm run headless\` for CLI-based setup.
EOF
fi
echo "[docs.runbook] done."
