// File: route.ts
// filepath: d:\assignments_internship\fueler\app\api\twitter\[query]\route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface Params {
    params: {
        query: string;
    };
}

interface Tweet {
    id: string;
    text: string;
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
            },
            headers: {
                Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN?.trim()}`
            },
        });

        const tweets = (response.data?.data as Tweet[]) || [];
        const items = tweets.map((tweet: Tweet) => {
            const text = tweet.text || "";
            return {
                title: text.length > 60 ? text.slice(0, 60) + "..." : text || "No title",
                description: text,
                thumbnail: "",
                url: `https://twitter.com/i/web/status/${tweet.id}`,
            };
        });

        return NextResponse.json({ items });
    } catch (error: unknown) {
        console.error('Twitter API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Twitter data' },
            { status: 500 }
        );
    }
}