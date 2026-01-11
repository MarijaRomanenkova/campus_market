/**
 * Root Layout Component
 * @module Layouts
 * @group Root Layout
 * 
 * This layout component provides the main application structure for all pages
 * in the root route group, including header, main content area, and footer.
 * It fetches categories for the navigation menu and maintains a consistent
 * layout across all root pages.
 */

import Header from "@/components/shared/header";
import Footer from "@/components/footer";
import { getAllCategories } from '@/lib/actions/product.actions';
import { checkPrismaConnection } from '@/db/prisma';
import { Category } from '@/types';

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

/**
 * Root Layout Component
 * 
 * This server component renders the main application layout structure with:
 * - Header with navigation and category menu
 * - Main content area for child components
 * - Footer with site information
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render in the main content area
 * @returns {JSX.Element} Complete page layout with header, content, and footer
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check database connection first
  await checkPrismaConnection();
  
  // Fetch all categories for the navigation menu with fallback
  let categories: Category[] = [];
  try {
    categories = await getAllCategories() as Category[];
  } catch (error) {
    console.error("Failed to load categories:", error);
    // Continue with empty categories if there's an error
  }

  return (
    <div className="flex h-screen flex-col">
      <Header categories={categories} />
      <main className="main flex-1 wrapper">{children}</main>
      <Footer />
    </div>
  );
}
