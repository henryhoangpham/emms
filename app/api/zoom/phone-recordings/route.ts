import { NextRequest, NextResponse } from 'next/server';
import { getZoomAccessToken } from '../utils';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const accessToken = await getZoomAccessToken();
    const searchParams = req.nextUrl.searchParams;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Add pagination
    const pageSize = searchParams.get('page_size') || '20';
    queryParams.append('page_size', pageSize);
    
    const nextPageToken = searchParams.get('next_page_token');
    if (nextPageToken) {
      queryParams.append('next_page_token', nextPageToken);
    }
    
    // Handle date filters
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // If only fromDate is provided, we'll search by start_time
    if (fromDate && !toDate) {
      queryParams.append('query_date_type', 'start_time');
      const formattedFrom = format(new Date(fromDate), 'yyyy-MM-dd');
      queryParams.append('from', formattedFrom);
      
      // Add 30 days to from date as the default range
      const thirtyDaysLater = new Date(fromDate);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      const formattedTo = format(thirtyDaysLater, 'yyyy-MM-dd');
      queryParams.append('to', formattedTo);
    }
    
    // If only toDate is provided, we'll search by end_time
    else if (!fromDate && toDate) {
      queryParams.append('query_date_type', 'end_time');
      const formattedTo = format(new Date(toDate), 'yyyy-MM-dd');
      queryParams.append('to', formattedTo);
      
      // Subtract 30 days from to date as the default range
      const thirtyDaysBefore = new Date(toDate);
      thirtyDaysBefore.setDate(thirtyDaysBefore.getDate() - 30);
      const formattedFrom = format(thirtyDaysBefore, 'yyyy-MM-dd');
      queryParams.append('from', formattedFrom);
    }
    
    // If both dates are provided, use default start_time query type
    else if (fromDate && toDate) {
      queryParams.append('query_date_type', 'start_time');
      const formattedFrom = format(new Date(fromDate), 'yyyy-MM-dd');
      const formattedTo = format(new Date(toDate), 'yyyy-MM-dd');
      queryParams.append('from', formattedFrom);
      queryParams.append('to', formattedTo);
    }

    const url = `https://api.zoom.us/v2/phone/recordings?${queryParams.toString()}`;
    console.log('Fetching recordings with URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoom API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url
      });
      throw new Error(`Zoom API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      phone_recordings: data.recordings || [],
      total_records: data.total_records || 0,
      page_size: parseInt(pageSize),
      next_page_token: data.next_page_token,
      access_token: accessToken
    });

  } catch (error: any) {
    console.error('Error fetching phone recordings:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch recordings',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 