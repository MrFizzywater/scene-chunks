"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton({ buttonStyle }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      style={buttonStyle} // Apply the style passed from the header
      title="Log out of Scene Chunks"
    >
      🚪 Log Out
    </button>
  );
}