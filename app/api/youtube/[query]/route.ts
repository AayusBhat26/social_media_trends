import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface Params {
  params: {
    query: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  const { query } = await params;

  if (!query) {
    return NextResponse.json({ error: 'No query provided' }, { status: 400 });
  }

  try {
    // Replace with your actual YouTube API call logic.
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          q: query,
          key: process.env.YOUTUBE_API_KEY,
          part: 'snippet',
          maxResults: 5
        }
      }
    );
    // console.log("YouTube API Response:", response.data);
    
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 500 });
  }
}
