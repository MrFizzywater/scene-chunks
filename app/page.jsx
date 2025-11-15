// app/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // you can hardcode an id or use "default"
    router.replace("/project/default");
  }, [router]);

  return null;
}
