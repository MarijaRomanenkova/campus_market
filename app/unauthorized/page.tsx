/**
 * Unauthorized Access Page Component
 * @module Pages
 * @group Error
 * 
 * This page is displayed when a user attempts to access a protected resource
 * without proper authentication or authorization.
 * It provides a clear message and a link to return to the home page.
 */

import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import Link from 'next/link'

/**
 * Metadata for the Unauthorized page
 * Sets the page title for SEO and browser tab purposes
 */
export const metadata: Metadata = {
  title: 'Unauthorized Access',
}

/**
 * Unauthorized Access Page Component
 * 
 * Renders a simple error page informing the user they don't have permission
 * to access the requested resource, with a button to return to the home page.
 * 
 * @returns {JSX.Element} The rendered unauthorized access page
 */
export default function UnauthorizedPage() {
  return (
    <div className='container mx-auto flex h-[calc(100vh-200px)] flex-col items-center justify-center space-y-4'>
      <h1 className='h1-bold text-4xl'>Unauthorized Access</h1>
      <p className='text-muted-foreground'>
        You do not have permission to access this page.
      </p>
      <Button asChild>
        <Link href='/'>Return Home</Link>
      </Button>
    </div>
  )
}
