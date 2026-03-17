import { auth } from "./auth"

// Export the auth function as the default export so Next.js recognizes it as the proxy
export default auth;

// Don't invoke the proxy on some paths (like public images or the API routes themselves)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}