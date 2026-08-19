import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"


export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/Login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}
