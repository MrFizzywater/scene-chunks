// app/project/[projectId]/page.jsx
// NO "use client" here. This is a Server Component.

import { auth, signIn } from "../../../auth"
import ProjectEditor from "./ProjectEditor" // We will create this next

export default async function ProjectPage({ params }) {
  // 1. Ask the bouncer who is at the door
  const session = await auth()

  // 2. THE WALL: If they aren't logged in, serve them a splash screen
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

  // 3. THE APP: They passed the check. Pass the projectId to the client component.
  return <ProjectEditor projectId={params.projectId} />
}