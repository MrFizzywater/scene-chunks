import { signOut } from "../auth"; // Adjust path to your root auth.js file

export default function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        // This obliterates the session cookie and kicks them to the homepage
        await signOut({ redirectTo: "/" }); 
      }}
    >
      <button
        type="submit"
        className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors border border-zinc-700 hover:border-zinc-500 rounded bg-zinc-800"
      >
        Eject / Log Out
      </button>
    </form>
  );
}