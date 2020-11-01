if exists('current_compiler')
  finish
endif
let current_compiler = 'htmlhint'

if exists(":CompilerSet") != 2 " older Vim always used :setlocal
  command -nargs=* CompilerSet setlocal <args>
endif

let s:cpo_save = &cpo
set cpo-=C

CompilerSet makeprg=htmlhint\ %

let &cpo = s:cpo_save
unlet s:cpo_save
