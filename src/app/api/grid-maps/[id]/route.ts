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

    
    const updatedMap = await prisma.gridMap.update({
      where: { id },
      data: mapData
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
