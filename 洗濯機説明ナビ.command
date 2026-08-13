#!/bin/zsh

set -e
APP_DIR=${0:A:h}
cd "$APP_DIR"

echo "洗濯機説明ナビを起動します"
echo "ブラウザで http://localhost:4174 を開いてください"
echo "終了するときはこの画面で Control + C を押します"
python3 -m http.server 4174 --directory app
