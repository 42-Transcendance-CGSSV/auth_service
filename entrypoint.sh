#!/bin/bash
set -e

rm -rf project
git clone https://github.com/42-Transcendance-CGPSV/auth_service.git project
cd project

git checkout "$BRANCH"

npm run build
node 'output/app.js'
