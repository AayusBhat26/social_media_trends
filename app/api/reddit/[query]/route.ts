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
  // Ensure the correct parameter is provided
  const { query } = params;
  console.log("Reddit API received query:", query);

  if (!query) {
    return NextResponse.json(
      { error: 'No query provided' },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get('https://www.reddit.com/search.json', {
      params: {
        q: query,
        sort: 'relevance', // Ensuring sorting improves matching results
        limit: 5,
      },
      headers: {
        // Reddit requires a valid User-Agent header.
        'User-Agent': 'NextJSApp/1.0 (by /u/DegreeMission1678)',
      },
    });

    // Log the complete response to inspect the structure
    console.log("Full Reddit response:", response.data);

    // Make sure the response structure is as expected
    const children = response.data?.data?.children;
    if (!Array.isArray(children)) {
      console.error("Unexpected Reddit response structure for query:", query, response.data);
      return NextResponse.json(
        { error: 'Unexpected response structure from Reddit' },
        { status: 500 }
      );
    }
    if (children.length === 0) {
      console.warn("Empty Reddit posts array for query:", query);
    }

    const items = children.map((child: any) => {
      const post = child.data;
      return {
        title: post.title || "No title",
        description: post.selftext || "",
        thumbnail:
          post.thumbnail && typeof post.thumbnail === 'string' && post.thumbnail.startsWith('http')
            ? post.thumbnail
            : "",
      };
    });
    // console.log("reddit data: ",items);
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching Reddit data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Reddit data' },
      { status: 500 }
    );
  }
}