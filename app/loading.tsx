/**
 * Global Loading Component
 * @module Components
 * @group Layout
 * 
 * This component is shown during page transitions and data loading.
 * It displays a centered loading animation to provide feedback to users.
 */

import Image from "next/image";
import loader from "@/public/assets/loader.gif";

/**
 * Loading Component
 * 
 * Renders a full-screen loading spinner animation.
 * Used as a fallback UI during navigation and suspense boundaries.
 * 
 * @returns {JSX.Element} The rendered loading indicator
 */
const Loading = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Image 
        src={loader} 
        alt="Loading" 
        width={150} 
        height={150}
        priority
        style={{ width: 'auto', height: 'auto' }}
      />
    </div>
  );
};

export default Loading; 
