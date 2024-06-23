augroup SassGotoFileAutocommands
  autocmd!

  autocmd FileType sass nnoremap <silent> <buffer> gf :silent call <SID>SassGotoFile()<Return>
  autocmd FileType scss nnoremap <silent> <buffer> gf :silent call <SID>SassGotoFile()<Return>
augroup END

" Go to file for Sass
function! s:SassGotoFile()
  let cfile = expand('<cfile>')
  let path = findfile(cfile)

  if empty(path)
    let path = findfile(substitute(cfile, '\%(.*/\|^\)\zs', '_', ''))
  endif

  if empty(path)
    let path = finddir(cfile)
  endif

  if empty(path)
    echoerr "E447: Can't find file \"" . cfile . "\" in path"
    return
  endif

  execute 'edit ' . path
endfunction
