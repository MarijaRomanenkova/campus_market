'use client';

/**
 * Theme Mode Toggle Component
 * @module Components
 * @group Shared/Header
 * 
 * This client-side component provides a dropdown menu for switching
 * between light, dark, and system color themes.
 */

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon, SunMoon } from "lucide-react";

/**
 * Mode Toggle Component
 * 
 * Renders a theme selector dropdown with:
 * - Dynamic icon based on current theme
 * - Options for light, dark, and system themes
 * - Client-side hydration handling
 * - Checkbox indicators for the active theme
 * 
 * Integrates with next-themes for theme management.
 * 
 * @returns {JSX.Element|null} The rendered theme toggle or null during hydration
 */
const ModeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Handle client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until client-side hydration is complete
  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="focus-visible:ring-0 focus-visible:ring-offset-0" size="sm">
          {theme === "system" ? (
            <SunMoon className="h-5 w-5" />
          ) : theme === "dark" ? (
            <MoonIcon className="h-5 w-5" />
          ) : (
            <SunIcon className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={theme === "system"} onCheckedChange={() => setTheme("system")}>System</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={theme === "light"} onCheckedChange={() => setTheme("light")}>Light</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={theme === "dark"} onCheckedChange={() => setTheme("dark")}>Dark</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
  );
};

export default ModeToggle;
