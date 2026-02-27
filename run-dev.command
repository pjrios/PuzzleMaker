#!/bin/bash

set -e

cd "$(dirname "$0")"

# Load nvm when launched from Finder (non-login shell).
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js from https://nodejs.org and try again."
  read -r -p "Press Enter to close..."
  exit 1
fi

echo "Installing dependencies (if needed)..."
if ! npm install; then
  echo "npm install failed."
  read -r -p "Press Enter to close..."
  exit 1
fi

echo "Starting dev server on port 3001..."
echo "Open http://localhost:3001 in your browser."
npm run dev -- --port 3001
