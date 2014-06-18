" vim-css3-syntax: https://github.com/hail2u/vim-css3-syntax
runtime! syntax/css/html5-elements.vim
runtime! syntax/css/css3-animations.vim
runtime! syntax/css/css3-background.vim
runtime! syntax/css/css3-box.vim
runtime! syntax/css/css3-colors.vim
runtime! syntax/css/css3-content.vim
runtime! syntax/css/css3-flexbox.vim
runtime! syntax/css/css3-functions.vim
runtime! syntax/css/css3-gcpm.vim
runtime! syntax/css/css3-grid.vim
runtime! syntax/css/css3-hyperlinks.vim
runtime! syntax/css/css3-images.vim
runtime! syntax/css/css3-layout.vim
runtime! syntax/css/css3-linebox.vim
runtime! syntax/css/css3-lists.vim
runtime! syntax/css/css3-marquee.vim
" runtime! syntax/css/css3-mediaqueries.vim
runtime! syntax/css/css3-multicol.vim
runtime! syntax/css/css3-preslev.vim
runtime! syntax/css/css3-pseudo-classes.vim
runtime! syntax/css/css3-ruby.vim
runtime! syntax/css/css3-text.vim
runtime! syntax/css/css3-transforms.vim
runtime! syntax/css/css3-transitions.vim
runtime! syntax/css/css3-ui.vim
runtime! syntax/css/css3-writing-modes.vim

" Missing function names
syn match sassFunction "\<\%(invert\)\>(\@=" contained
syn match sassFunction "\<\%(adjust-color\|scale-color\|change-color\)\>(\@=" contained
syn match sassFunction "\<\%(length\|nth\|join\)\>(\@=" contained
syn match sassFunction "\<\%(if\)\>(\@=" contained

" Missing @content
syn match sassContent "@content"

" User defined function: @function
syn match sassUserFunctionName "[[:alnum:]_-]\+" contained nextgroup=sassCssAttribute
syn match sassUserFunction     "^=" nextgroup=sassUserFunctionName
syn match sassUserFunction     "\%([{};]\s*\|^\s*\)\@<=@function" nextgroup=sassUserFunctionName skipwhite
syn match sassUserFunctiong    "^\s\+\zs+" nextgroup=sassUserFunctionName
syn region sassReturnLine end=";\|$" matchgroup=sassReturn start="@return\>" contains=@sassCssAttributes,sassVariable,sassFunction

" Placeholder selector: %foo
syn match sassPlaceholderChar "%[[:alnum:]_-]\@=" nextgroup=sassPlaceholder
syn match sassPlaceholder     "[[:alnum:]_-]\+" contained

" Missing control directives: @each $var in foo, bar, buz
syn region sassControlLine matchgroup=sassControl start="@\%(each\)\>" end="[{};]\@=\|$" contains=sassEach,@sassCssAttributes,sassVariable,sassFunction
syn keyword sassEach in contained

" Colorscheme
hi def link sassContent         sassControl
hi def link sassUserFunctiong   PreProc
hi def link sassUserFunction    PreProc
hi def link sassReturn          sassControl
hi def link sassEach            PreProc
hi def link sassPlaceholderChar Special
hi def link sassPlaceholder     Identifier
