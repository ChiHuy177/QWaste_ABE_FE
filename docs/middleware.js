// Tự động phát hiện ngôn ngữ của người dùng và redirect /... -> /vi/... hoặc /en/...
export { proxy as middleware } from 'nextra/locales'

export const config = {
  matcher: [
    '/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind).*)'
  ]
}
