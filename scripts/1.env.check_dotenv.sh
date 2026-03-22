#!/bin/bash
# 1.env.check_dotenv.sh
echo "[env.check_dotenv] Checking Environment and Secrets setup..."

if [ -f "hd/SECRETS.md" ]; then
    echo "✅ SECRETS.md template found."
else
    echo "❌ Missing hd/SECRETS.md reference."
fi

echo "Checking Doppler CLI setup..."
if command -v doppler >/dev/null 2>&1; then
    # We don't log secrets, just list the names if configured
    if doppler secrets >/dev/null 2>&1; then
        echo "✅ Doppler projects and secrets are accessible."
    else
        echo "❌ Doppler is installed but not configured for this directory."
    fi
else
    echo "❌ Doppler not installed."
fi
echo "[env.check_dotenv] done."
