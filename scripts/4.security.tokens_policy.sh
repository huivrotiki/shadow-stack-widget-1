#!/bin/bash
# 4.security.tokens_policy.sh
echo "[security.tokens_policy] Auditing for hardcoded secrets..."
# Search for common tokens/keys patterns but exclude hd/SECRETS.md and .env
# We use a broad search but exclude safe directories
grep -rE "(API_KEY|TOKEN|SECRET|PASSWORD)\s*[:=]\s*['\"][0-9a-zA-Z-]{10,}['\"]" . \
  --exclude-dir={node_modules,dist,.git,.next} \
  --exclude={SECRETS.md,DOPPLER.md,.env,.env.example,PHASES.md,TRACKING.md} \
  || echo "✅ No hardcoded secrets found in source code (excluding .env/SECRETS.md)."

echo "Checking Doppler integration..."
if command -v doppler >/dev/null 2>&1; then
    echo "✅ Doppler CLI present."
else
    echo "⚠️ Doppler CLI missing from path. Ensure it is installed for production."
fi
echo "[security.tokens_policy] done."
