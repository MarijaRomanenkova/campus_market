/**
 * Email Verification Template
 * @module Email/Templates
 * 
 * This component renders an HTML email template for account verification links.
 * It includes the user's name, a verification link, and instructions for completing registration.
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { APP_NAME, SERVER_URL } from '@/lib/constants';

interface EmailVerificationProps {
  name: string;
  verificationLink: string;
}

export default function EmailVerification({
  name,
  verificationLink,
}: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your {APP_NAME} account</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="bg-white p-8 rounded-lg shadow-lg my-8 mx-auto max-w-md">
            <Heading className="text-2xl font-bold text-center text-gray-800 mb-4">
              Verify Your Email Address
            </Heading>
            
            <Section className="mb-6">
              <Text className="text-gray-700 mb-4">
                Hello {name},
              </Text>
              <Text className="text-gray-700 mb-4">
                Thank you for signing up with {APP_NAME}. To complete your registration and activate your account, 
                please use the verification link below:
              </Text>
              
              {/* Display the full link prominently */}
              <Text className="text-blue-600 text-center border border-blue-100 bg-blue-50 p-3 rounded-md break-all mb-4">
                <Link href={verificationLink} className="text-blue-600 font-medium">
                  {verificationLink}
                </Link>
              </Text>
              
              {/* Button option */}
              <Text className="text-center mb-2">Or click this button:</Text>
              <Button 
                href={verificationLink}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-md text-center block mx-auto"
                style={{ backgroundColor: "#2563EB", color: "white", padding: "16px 32px", borderRadius: "6px", fontSize: "16px", fontWeight: "bold", textDecoration: "none", display: "inline-block", textAlign: "center", margin: "0 auto" }}
              >
                Verify Email Address
              </Button>
            </Section>
            
            <Section className="border-t border-gray-200 pt-6">
              <Text className="text-gray-600 text-sm mb-4">
                This link will expire in 24 hours. If you didn&apos;t request this verification, 
                you can safely ignore this email.
              </Text>
              <Text className="text-gray-600 text-sm">
                For security, please don&apos;t forward this email to anyone.
              </Text>
            </Section>
            
            <Section className="text-center text-gray-500 text-xs mt-8">
              <Text>
                &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
              </Text>
              <Link 
                href={SERVER_URL} 
                className="text-blue-500 underline font-medium"
              >
                Visit {APP_NAME} Website
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Sample props for previewing the email template
EmailVerification.PreviewProps = {
  name: "John Doe",
  verificationLink: "https://example.com/verify-email?token=abc123",
} as EmailVerificationProps; 
