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
  const { query } = params;

  if (!query) {
    return NextResponse.json(
      { error: 'No query provided' },
      { status: 400 }
    );
  }

  console.log('Received query:', query, 'Bearer token:', process.env.TWITTER_BEARER_TOKEN);

  try {
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      params: {
        query,
        max_results: 11,
        // tweets.fields: 'id,text'  
      },
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN?.trim()}`,
      },
    });

    const tweets = response.data?.data || [];
    const items = tweets.map((tweet: any) => {
      const text = tweet.text || "";
      return {
        title: text.length > 60 ? text.slice(0, 60) + "..." : text || "No title",
        description: text,
        thumbnail: "", // Twitter API v2 doesn't include media by default.
        url: `https://twitter.com/i/web/status/${tweet.id}`, // use tweet.id instead of tweet.id_str
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Twitter API Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch Twitter data' },
      { status: 500 }
    );
  }
}