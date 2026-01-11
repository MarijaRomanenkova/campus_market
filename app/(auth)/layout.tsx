/**
 * Authentication Layout Component
 * @module Authentication
 * @group Auth Layout
 * 
 * This layout component wraps all authentication-related pages (sign-in, sign-up)
 * and provides a consistent centered layout with full viewport height.
 */

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex-center min-h-screen w-full">
      {children} 
    </div>
  );
}
