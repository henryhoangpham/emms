import { NextRequest, NextResponse } from 'next/server';
import { getZoomAccessToken } from '../../utils';

export async function POST(req: NextRequest) {
  try {
    const accessToken = await getZoomAccessToken();
    const { downloadUrl } = await req.json();

    if (!downloadUrl) {
      throw new Error('Download URL is required');
    }

    const fileResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!fileResponse.ok) {
      const errorText = await fileResponse.text();
      console.error('Failed to download recording:', {
        status: fileResponse.status,
        statusText: fileResponse.statusText,
        error: errorText,
        url: downloadUrl
      });
      throw new Error('Failed to download recording file');
    }

    // Get the file content
    const fileBuffer = await fileResponse.arrayBuffer();

    // Return the file as a response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="recording.mp3"`,
      },
    });
  } catch (error: any) {
    console.error('Zoom API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to download recording',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 