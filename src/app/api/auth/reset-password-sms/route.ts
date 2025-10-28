import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, code, password } = await request.json();

    if (!email || !code || !password) {
      return NextResponse.json(
        { error: 'Email, code, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit code' },
        { status: 400 }
      );
    }

    // Find user with valid SMS reset code using email
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        smsResetCode: code,
        smsResetExpiry: {
          gt: new Date() // Code must not be expired
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear SMS reset code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        smsResetCode: null,
        smsResetExpiry: null,
        // Also clear email reset tokens if any
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password SMS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
