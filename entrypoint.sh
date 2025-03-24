#!/bin/bash
set -e

rm -rf project
git clone https://github.com/42-Transcendance-CGPSV/auth_service.git project
cd project

echo "My port ${PORT}"
git checkout "$BRANCH"

echo "Npm install"
npm install --omit=optional --omit=dev
npm run build
node 'output/app.js'
