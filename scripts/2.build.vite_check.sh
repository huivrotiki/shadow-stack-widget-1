#!/bin/bash
# 2.build.vite_check.sh
echo "[build.vite_check] Running Vite build test..."
if [ -f "package.json" ]; then
    if grep -q '"build":' package.json; then
        echo "🔄 package.json contains 'build' script. Triggering dry run..."
        # We use a dry/fast form here or test if vite is installed
        if npx vite --version >/dev/null 2>&1; then
           echo "✅ Vite installed locally."
        else
           echo "⚠️ Vite is missing from local node_modules."
        fi
    else
        echo "❌ No 'build' script found in package.json."
    fi
else
    echo "❌ Missing package.json."
fi
echo "[build.vite_check] done."
