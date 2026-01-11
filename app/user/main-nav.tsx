'use client';

/**
 * Main Navigation Component
 * @module Components
 * @group Navigation
 * 
 * This client-side component renders the main navigation links for the user dashboard.
 * It highlights the current active section based on the URL path.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { LayoutDashboard, ScrollText, ClipboardList, FileCheck, Send, Download } from 'lucide-react';

/**
 * Navigation link configuration
 * @type {Array<{title: string, href: string, icon: JSX.Element}>}
 */
const links = [
  {
    title: 'Dashboard',
    href: '/user/dashboard',
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />
  },
  {
    title: 'My Products',
    href: '/user/dashboard/client/product',
    icon: <ClipboardList className="h-4 w-4 mr-2" />
  },
  {
    title: 'My Assignments',
    href: '/user/dashboard/client/product-assignments',
    icon: <FileCheck className="h-4 w-4 mr-2" />
  },
  {
    title: 'Received Invoices',
    href: '/user/dashboard/client/invoices',
    icon: <Download className="h-4 w-4 mr-2" />
  },
  {
    title: 'Issued Invoices',
    href: '/user/dashboard/seller/invoices',
    icon: <Send className="h-4 w-4 mr-2" />
  },
  {
    title: 'Assignments',
    href: '/user/dashboard/seller/assignments',
    icon: <FileCheck className="h-4 w-4 mr-2" />
  }
];

/**
 * Main Navigation Component
 * 
 * Renders a horizontal navigation bar with icons and text for the main
 * sections of the user dashboard. Automatically highlights the current
 * active section based on the URL path.
 * 
 * @param {Object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes to apply
 * @returns {JSX.Element} The rendered navigation component
 */
const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  
  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary flex items-center',
            pathname.includes(item.href) 
              ? 'text-primary' 
              : 'text-muted-foreground'
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;
