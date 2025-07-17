"use client";
import { ReactNode, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { useDeviceStore } from "./deviceStore";

export function DeviceProvider({ children }: { children: ReactNode }) {
  const setIsMobile = useDeviceStore((state) => state.setIsMobile);
  const matches = useMediaQuery({ query: "(max-width: 640px)" });

  useEffect(() => {
    setIsMobile(matches);
  }, [matches, setIsMobile]);

  return <>{children}</>;
} 