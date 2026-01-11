'use client';

/**
 * Global 404 Not Found Page Component
 * @module Pages
 * @group Error
 * 
 * This component is shown when a user navigates to a non-existent route.
 * It displays a friendly error message and provides navigation back to the home page.
 */

import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import LogoWithTheme from '@/components/shared/logo-with-theme';

/**
 * NotFound Component
 * 
 * Renders a 404 error page with:
 * - Application logo
 * - Error message indicating the page doesn't exist
 * - Navigation button to return to the home page
 * 
 * Uses client-side navigation to redirect users back to the home page.
 * 
 * @returns {JSX.Element} The rendered not found page
 */
const NotFound = () => {
  const router = useRouter();


  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="mb-4">
        <LogoWithTheme
          width={100}
          height={100}
          alt={`${APP_NAME} logo`}
          priority={true}
        />
      </div>
      <div className="p-6 s-1/3 rounded-lg bg-card shadow-md">
        <h1 className="text-3xl font-boldcmb-4">Page Not Found</h1>
        <p className="text-destructive mb-4">The page you are looking for does not exist.</p>
        <Button variant="outline" className="mt-4 mb-2" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;  
