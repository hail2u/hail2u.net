#!/bin/sh

# Dependencies
# gh-open: https://github.com/typester/gh-open

BRANCH=$1

git checkout master &&
git checkout -b $BRANCH &&
git commit --allow-empty -m "WIP $BRANCH" &&
git push origin $BRANCH &&
gh-open .
