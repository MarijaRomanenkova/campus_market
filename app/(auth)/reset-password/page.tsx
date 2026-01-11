import ResetPasswordForm from './reset-password-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LogoWithTheme from '@/components/shared/logo-with-theme';
import { APP_NAME } from '@/lib/constants';

export const metadata = {
  title: 'Reset Password | Campus Market',
  description: 'Set a new password for your account',
};

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          {/* Application logo with link to home page */}
          <div className='flex-center'>
            <LogoWithTheme 
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
              priority={true}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
} 
