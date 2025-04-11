// src/components/DBInitializer.tsx
"use client";

import { useEffect, ReactNode } from "react";
import { initializeDB } from "@/lib/db/schema";

interface DBInitializerProps {
  children: ReactNode;
}

export default function DBInitializer({ children }: DBInitializerProps) {
  useEffect(() => {
    initializeDB().catch((err) => {
      console.error("Error starting DB:", err);
    });
  }, []);

  return <>{children}</>;
}
