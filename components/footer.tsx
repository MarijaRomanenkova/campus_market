/**
 * Footer Component
 * @module Components
 * @group Layout
 * 
 * This component renders the application footer that appears at the bottom of every page.
 * It displays the application branding, navigation links, contact information, and copyright notice.
 */

import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

/**
 * Footer Component
 * 
 * Renders a two-part footer with:
 * - Main footer section with company logo, description, and navigation links
 * - Secondary footer with copyright information
 * 
 * The footer is responsive, adjusting its layout based on screen size.
 * Column arrangement changes from stacked on mobile to horizontal on larger screens.
 * 
 * @returns {JSX.Element} The rendered footer
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer>
      {/* New black footer section with columns */}
      <div className="bg-black text-white">
        <div className="container mx-auto py-10 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Column 1: Logo + Campus Market + Description */}
            <div className="flex flex-col">
              <div className="flex items-center mb-4">
                <Image 
                  src="/images/logo.svg" 
                  width={32}
                  height={32}
                  alt={APP_NAME}
                  className="invert brightness-100"
                />
                <span className="ml-3 text-4xl font-bold">{APP_NAME}</span>
              </div>
              <p className="text-sm text-gray-400">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae nisi et justo eleifend ullamcorper. 
                Etiam eget metus vitae justo fermentum.
              </p>
            </div>
            
            {/* Column 2: Empty on large screens, hidden on medium and below */}
            <div className="hidden lg:block">
              {/* Intentionally left empty */}
            </div>
            
            {/* Column 3: Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/legal" className="text-gray-400 hover:text-white transition-colors">
                    Legal
                  </Link>
                </li>
                <li>
                  <Link href="/impressium " className="text-gray-400 hover:text-white transition-colors">
                    Impressium
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Column 4: Contact & Legal info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{APP_NAME}</h3>
              <address className="not-italic text-gray-400">
                123 Campus St.<br />
                Amsterdam, 1012 AB<br />
                Netherlands
              </address>
              <p className="text-gray-400 mt-2">
                Reg. Number: KVK 12345678
              </p>
              <p className="text-gray-400 mt-2">Contact Us</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Original footer section (copyright) */}
      <div className="wrapper">
        <div className="p-5 flex justify-center items-center text-sm">
          {currentYear} &copy; {APP_NAME}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

