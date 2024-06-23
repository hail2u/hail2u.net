#!/bin/sh

b=${GEM_HOME}/bin/scss-lint
r=`git rev-parse --show-cdup 2>/dev/null`
c=${r}.scss-lint.yml

if [ $? -eq 0 ] && [ -e $c ]; then
  ${b} -c ${c} $*
else
  ${b} $*
fi
