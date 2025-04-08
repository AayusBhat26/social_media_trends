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
        return NextResponse.json({ error: 'No query provided' }, { status: 400 });
    }

    try {
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

        return NextResponse.json(response.data);
    } catch (_error) {
        return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 500 });
    }
}