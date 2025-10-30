import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const maps = await prisma.gridMap.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        shared: true,
        accessCode: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ maps });
  } catch (error) {
    console.error('Error fetching maps:', error);
    return NextResponse.json({ error: 'Failed to fetch maps' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('SIMPLE API - Starting');
    
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log('SIMPLE API - No user');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('SIMPLE API - User authenticated:', user.email);
    
    const mapData = await request.json();
    console.log('SIMPLE API - Received data keys:', Object.keys(mapData));
    
    // Remove fields that shouldn't be set directly
    const { shared, accessCode, ...safeData } = mapData;
    
    console.log('SIMPLE API - Using safe data');
    
    const gridMap = await prisma.gridMap.create({
      data: {
        ...safeData,
        userId: user.id,
      }
    });
    
    console.log('SIMPLE API - Created map:', gridMap.id);
    return NextResponse.json(gridMap, { status: 201 });
    
  } catch (error: any) {
    console.error('SIMPLE API - Error:', error);
    console.error('SIMPLE API - Error message:', error?.message);
    return NextResponse.json({ 
      error: 'Simple API failed',
      details: error?.message 
    }, { status: 500 });
  }
}
