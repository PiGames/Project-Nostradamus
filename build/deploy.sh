#!/bin/bash
if [ $1 ] && [ $2 ]
then
  npm run build
  cp -r ./dist ./.publish
  cd .publish
  git init
  git checkout -b $2
  git add .
  git commit -m "Update $(date +"%FT%XZ")"
  git status
  git push $1 $2 -f
  cd ..
  rm -rf .publish

else
  echo "Please specify origin and branch"
fi
