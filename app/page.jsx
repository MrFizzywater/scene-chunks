// app/page.jsx
// No "use client" here!

import { auth, signIn } from "../auth" // Adjust this path if auth is somewhere else
import HomePageClient from "./HomePageClient"

export default async function Home() {
  // 1. Ask the bouncer
  const session = await auth()

  // 2. THE WALL: Not logged in
  if (!session?.user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900 text-zinc-100">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tighter">Scene Chunks</h1>
          <p className="text-zinc-400">Modular screenwriting. Log in to access the editor.</p>
          <form
            action={async () => {
              "use server"
              await signIn("github")
            }}
          >
            <button 
              type="submit"
              className="px-6 py-3 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors"
            >
              Log in with GitHub
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 3. THE APP: They passed the check. Hand it off to the client component.
  return <HomePageClient />
}