import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { gridMapSchema } from '@/lib/validation';
import { apiRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = apiRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    console.log('POST /api/grid-maps - Starting request');
    
    const user = await getUserFromRequest(request);
    
    if (!user) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', user.id);

    // Check map limit (10 maps per user)
    const existingMapsCount = await prisma.gridMap.count({
      where: { userId: user.id }
    });

    if (existingMapsCount >= 10) {
      return NextResponse.json(
        { error: 'Map limit reached. You can only create up to 10 maps.' },
        { status: 403 }
      );
    }

    const mapData = await request.json();
    
    // Validate input data
    const validationResult = gridMapSchema.safeParse(mapData);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }
    console.log('Received map data keys:', Object.keys(mapData));
    console.log('referenceColors type:', typeof mapData.referenceColors);
    console.log('referenceColors value:', mapData.referenceColors);
    
    // Remove fields that shouldn't be set directly
    const {
      shared,
      accessCode,
      ...safeMapData
    } = mapData;
    
    console.log('Safe map data keys:', Object.keys(safeMapData));
    console.log('Safe referenceColors:', safeMapData.referenceColors);
    
    // Serialize JSON fields if they are objects
    const processedData = {
      ...safeMapData,
      userId: user.id,
    };
    
    // Ensure referenceColors is a JSON string
    if (processedData.referenceColors && typeof processedData.referenceColors === 'object') {
      processedData.referenceColors = JSON.stringify(processedData.referenceColors);
    }
    
    // Ensure other JSON fields are strings
    if (processedData.sliceNames && typeof processedData.sliceNames === 'object') {
      processedData.sliceNames = JSON.stringify(processedData.sliceNames);
    }
    
    if (processedData.panOffset && typeof processedData.panOffset === 'object') {
      processedData.panOffset = JSON.stringify(processedData.panOffset);
    }
    
    if (processedData.gridOffset && typeof processedData.gridOffset === 'object') {
      processedData.gridOffset = JSON.stringify(processedData.gridOffset);
    }
    
    if (processedData.imageDimensions && typeof processedData.imageDimensions === 'object') {
      processedData.imageDimensions = JSON.stringify(processedData.imageDimensions);
    }
    
    console.log('Processed data for Prisma:', processedData);
    
    const gridMap = await prisma.gridMap.create({
      data: processedData
    });

    return NextResponse.json(gridMap, { status: 201 });
  } catch (error: any) {
    console.error('=== DETAILED ERROR ===');
    console.error('Error creating grid map:', error);
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error meta:', error?.meta);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    console.error('=== END ERROR ===');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: error?.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const gridMaps = await prisma.gridMap.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(gridMaps);
  } catch (error) {
    console.error('Error fetching grid maps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
