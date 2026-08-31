"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button
      className="bg-gray-700 px-3 py-1 rounded-md"
      onClick={() => setDark(!dark)}
    >
      {dark ? "ðŸŒ™ Dark" : "â˜€ï¸ Light"}
    </button>
  );
}



