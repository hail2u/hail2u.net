if exists('current_compiler')
  finish
endif
let current_compiler = 'csslint'

if exists(":CompilerSet") != 2 " older Vim always used :setlocal
  command -nargs=* CompilerSet setlocal <args>
endif

let s:cpo_save = &cpo
set cpo-=C

CompilerSet makeprg=csslint\ --format=compact\ --errors=display-property-grouping,duplicate-properties,empty-rules,import,known-properties,star-property-hack,underscore-property-hack\ %

CompilerSet errorformat=
  \%f:\ line\ %l\\,\ col\ %c\\,\ %trror\ -\ %m,
  \%f:\ %trror\ -\ %m,
  \%-G%.%#

let &cpo = s:cpo_save
unlet s:cpo_save
