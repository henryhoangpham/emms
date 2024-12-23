export async function getZoomAccessToken() {
  const tokenUrl = 'https://zoom.us/oauth/token';
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
  const accountId = process.env.ZOOM_ACCOUNT_ID!;

  try {
    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: accountId
    });

    const tokenResponse = await fetch(`${tokenUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get access token:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to obtain access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting Zoom access token:', error);
    throw error;
  }
} 