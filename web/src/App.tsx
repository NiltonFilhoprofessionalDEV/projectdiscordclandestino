import { useState } from "react";
import { parseDisplayName } from "../../shared/displayName.ts";
import { readDisplayName, writeDisplayName } from "./lib/storage.ts";
import { Home } from "./pages/Home.tsx";
import { NameGate } from "./pages/NameGate.tsx";

export function App() {
  const [displayName, setDisplayName] = useState(() => {
    const stored = readDisplayName();
    if (!stored) {
      return null;
    }
    const parsed = parseDisplayName(stored);
    return parsed.ok ? parsed.value : null;
  });

  if (!displayName) {
    return (
      <NameGate
        onSubmit={(name) => {
          writeDisplayName(name);
          setDisplayName(name);
        }}
      />
    );
  }

  return (
    <Home
      displayName={displayName}
      onRename={(name) => {
        writeDisplayName(name);
        setDisplayName(name);
      }}
    />
  );
}
