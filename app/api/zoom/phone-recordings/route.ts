import { NextRequest, NextResponse } from 'next/server';
import { getZoomAccessToken } from '../utils';

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
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '30');

  try {
    const accessToken = await getZoomAccessToken();

    const url = `https://api.zoom.us/v2/phone/recordings?page_size=${pageSize}&next_page_token=${searchParams.get('next_page_token') || ''}`;
    console.log('Fetching phone recordings from:', url);

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
    
    // Transform the recordings to match our interface
    const recordings = (data.recordings || []).map((recording: ZoomPhoneRecording) => ({
      id: recording.id,
      caller_name: recording.caller_name,
      caller_number: recording.caller_number,
      callee_name: recording.callee_name,
      callee_number: recording.callee_number,
      duration: recording.duration,
      recording_type: recording.recording_type,
      date_time: recording.date_time,
      end_time: recording.end_time,
      direction: recording.direction,
      download_url: recording.download_url,
      auto_delete_policy: recording.auto_delete_policy,
      owner: recording.owner,
      site: recording.site
    }));

    return NextResponse.json({
      phone_recordings: recordings,
      total_records: data.total_records || 0,
      page_size: data.page_size,
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