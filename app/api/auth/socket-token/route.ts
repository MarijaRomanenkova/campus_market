import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        sub: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      process.env.NEXTAUTH_SECRET!
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating socket token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
} 
