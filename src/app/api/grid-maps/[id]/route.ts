import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gridMap = await prisma.gridMap.findUnique({
      where: { id }
    });

    if (!gridMap) {
      return NextResponse.json(
        { error: 'Map not found' },
        { status: 404 }
      );
    }

    // Check if map is shared or user owns it
    const user = await getUserFromRequest(request);
    if (!gridMap.shared && (!user || gridMap.userId !== user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(gridMap);
  } catch (error) {
    console.error('Error fetching grid map:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const mapData = await request.json();
    console.log('Updating map - received keys:', Object.keys(mapData));

    // Check if user owns the map
    const existingMap = await prisma.gridMap.findUnique({
      where: { id }
    });

    if (!existingMap || existingMap.userId !== user.id) {
      return NextResponse.json(
        { error: 'Map not found or access denied' },
        { status: 404 }
      );
    }

    // Allow shared and accessCode to be updated by the owner
    console.log('Map data keys:', Object.keys(mapData));
    
    // Serialize JSON fields if they are objects
    const processedData = { ...mapData };
    
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
    
    if (processedData.sliceImageSettings && typeof processedData.sliceImageSettings === 'object') {
      processedData.sliceImageSettings = JSON.stringify(processedData.sliceImageSettings);
    }
    
    console.log('Processed data for Prisma update:', processedData);

    const updatedMap = await prisma.gridMap.update({
      where: { id },
      data: processedData
    });

    return NextResponse.json(updatedMap);
  } catch (error) {
    console.error('Error updating grid map:', error);
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user owns the map
    const existingMap = await prisma.gridMap.findUnique({
      where: { id }
    });

    if (!existingMap || existingMap.userId !== user.id) {
      return NextResponse.json(
        { error: 'Map not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.gridMap.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Map deleted successfully' });
  } catch (error) {
    console.error('Error deleting grid map:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
