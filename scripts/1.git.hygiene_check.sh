#!/bin/bash
# 1.git.hygiene_check.sh
echo "[git.hygiene_check] Checking Git state..."
if [ -d ".git" ]; then
    echo "✅ Git repository initialized."
    echo "Branches:"
    git branch -a
    echo "Uncommitted changes:"
    git status --short
else
    echo "❌ This is not a Git repository."
fi

echo "[git.hygiene_check] Checking .gitignore..."
if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        echo "✅ .env is explicitly ignored."
    else
        echo "❌ WARNING: .env is not in .gitignore."
    fi
else
    echo "❌ Missing .gitignore file."
fi
echo "[git.hygiene_check] done."
