import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetSMS, generateSMSCode } from '@/lib/sms';

export async function POST(request: NextRequest) {
  let email: string = '';
  let phone: string = '';
  
  try {
    const requestData = await request.json();
    email = requestData.email;
    phone = requestData.phone;

    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Email and phone number are required' },
        { status: 400 }
      );
    }

    // Format phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }

    // Check if user exists with this email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, we have sent a reset code to the provided phone number.' },
        { status: 200 }
      );
    }

    // Generate 6-digit SMS code
    const smsCode = generateSMSCode();
    const smsExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save SMS code to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        smsResetCode: smsCode,
        smsResetExpiry: smsExpiry
      }
    });

    // Send SMS with reset code to the provided phone number
    try {
      await sendPasswordResetSMS(phone, smsCode);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError instanceof Error ? smsError.message : 'Unknown error');
      
      // Clean up the code if SMS failed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          smsResetCode: null,
          smsResetExpiry: null
        }
      });
      
      return NextResponse.json(
        { error: 'Failed to send SMS. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, we have sent a reset code to the provided phone number.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('SMS reset error:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
