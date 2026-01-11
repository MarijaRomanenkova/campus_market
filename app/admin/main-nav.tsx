/**
 * Admin Main Navigation Component
 * @module Admin
 * @group Admin Components
 * 
 * This client component provides the main navigation for the admin panel,
 * highlighting the current section and enabling navigation between
 * different admin areas.
 */

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

/**
 * Navigation links configuration for admin sections
 * Each item includes a title and destination URL
 */
const links = [
  {
    title: 'Overview',
    href: '/admin/overview',
  },
  {
    title: 'Payments',
    href: '/admin/payments',
  },
  {
    title: 'Users',
    href: '/admin/users',
  },
  {
    title: 'Messages',
    href: '/admin/messages',
  },
];

/**
 * Main Navigation Component for Admin Dashboard
 * 
 * Renders the main navigation links for the admin panel with:
 * - Horizontal navigation bar
 * - Visual indication of the current active section
 * - Links to all major admin sections
 * 
 * @component
 * @param {Object} props - Component props extending HTMLAttributes<HTMLElement>
 * @param {string} [props.className] - Additional CSS classes to apply to the nav element
 * @returns {JSX.Element} Navigation bar with admin section links
 */
const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  // Get current pathname to highlight active link
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
            'text-sm font-medium transition-colors hover:text-primary',
            pathname.includes(item.href) ? '' : 'text-muted-foreground'
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;
