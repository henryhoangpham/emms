import { NextRequest, NextResponse } from 'next/server';
import { getZoomAccessToken } from '../utils';
import { format } from 'date-fns';

interface ZoomPhoneOwner {
  extension_number: number;
  id: string;
  name: string;
  type: string;
  extension_status?: string;
  extension_deleted_time?: string;
}

interface ZoomPhoneSite {
  id: string;
  name: string;
}

interface ZoomPhoneParticipant {
  name: string;
  extension_number: string;
}

interface ZoomPhoneRecording {
  auto_delete_policy: string;
  call_id: string;
  call_log_id: string;
  callee_name: string;
  callee_number: string;
  callee_number_type: number;
  caller_name: string;
  caller_number: string;
  caller_number_type: number;
  outgoing_by?: ZoomPhoneParticipant;
  accepted_by?: ZoomPhoneParticipant;
  date_time: string;
  disclaimer_status: number;
  direction: string;
  download_url: string;
  duration: number;
  end_time: string;
  id: string;
  meeting_uuid: string;
  owner: ZoomPhoneOwner;
  recording_type: string;
  site: ZoomPhoneSite;
  transcript_download_url?: string;
  auto_delete_enable: boolean;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const pageSize = parseInt(searchParams.get('page_size') || '30');
  const nextPageToken = searchParams.get('next_page_token') || '';
  
  // Get filter parameters
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  try {
    const accessToken = await getZoomAccessToken();

    // Build API URL with filters
    const params = new URLSearchParams({
      page_size: Math.min(pageSize, 300).toString(), // Ensure page_size doesn't exceed max
      next_page_token: nextPageToken
    });

    // Only add date parameters if both from and to are provided
    if (fromDate && toDate) {
      // Pass the dates as-is since they're already formatted correctly
      params.append('from', fromDate);
      params.append('to', toDate);
    }

    const url = `https://api.zoom.us/v2/phone/recordings?${params.toString()}`;
    console.log('Fetching phone recordings with params:', {
      pageSize,
      nextPageToken,
      fromDate,
      toDate,
      url
    });

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch phone recordings:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: response.url
      });
      throw new Error(`Failed to fetch phone recordings: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const filteredRecordings = data.recordings || [];

    return NextResponse.json({
      phone_recordings: filteredRecordings,
      total_records: data.total_records || 0,
      page_size: pageSize,
      next_page_token: data.next_page_token,
      access_token: accessToken
    });
  } catch (error: any) {
    console.error('Zoom API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch phone recordings',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 