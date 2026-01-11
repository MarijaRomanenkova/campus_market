import ForgotPasswordForm from './forgot-password-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LogoWithTheme from '@/components/shared/logo-with-theme';
import { APP_NAME } from '@/lib/constants';
export const metadata = {
  title: 'Forgot Password | Campus Market',
  description: 'Reset your password through email verification',
};

export default function ForgotPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <LogoWithTheme 
            width={100}
            height={100}
            alt={`${APP_NAME} logo`}
            priority={true}
          />
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
} 
