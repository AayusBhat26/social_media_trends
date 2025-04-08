import {  NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

interface RedditPost {
    title: string;
    selftext?: string;
    thumbnail?: string;
    url?: string;
}

interface RedditAPIResponse {
    data: {
        children: { data: { data: RedditPost } }[];
    };
}

export const runtime = 'nodejs';

export async function GET(context: { params: { query: string } }) {
    const { query } = context.params;
    console.log("Reddit API received query:", query);

    if (!query) {
        return NextResponse.json({ error: 'No query provided' }, { status: 400 });
    }

    try {
        const response = await axios.get<RedditAPIResponse>('https://www.reddit.com/search.json', {
            params: {
                q: query,
                sort: 'relevance',
                limit: 5,
            },
            headers: {
                'User-Agent': 'NextJSApp/1.0 (by /u/DegreeMission1678)',
            },
        });

        if (!response || !response.data) {
            console.error("Invalid Reddit API response:", response);
            return NextResponse.json({ error: 'Failed to fetch Reddit data: Invalid response' }, { status: 500 });
        }

        const redditData = response.data;
        console.log("Full Reddit response:", redditData);
        const children = redditData?.data?.children;

        if (!children || children.length === 0) {
            console.warn("No Reddit posts found for query:", query);
            return NextResponse.json({ items: [] });
        }

        const items: RedditPost[] = children.map((child) => {
            const post = child?.data?.data;
            return {
                title: post?.title ?? "No title",
                selftext: post?.selftext ?? "",
                thumbnail: post?.thumbnail && typeof post?.thumbnail === 'string' && post?.thumbnail.startsWith('http')
                    ? post?.thumbnail
                    : "",
                url: post?.url ?? "",
            };
        });

        return NextResponse.json({ items });

    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            const errorMessage = `Failed to fetch Reddit data: ${axiosError.message}, Status: ${axiosError.response?.status}, URL: ${axiosError.config?.url}`;
            console.error('Error fetching Reddit data:', errorMessage, axiosError.response?.data);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        console.error('Error fetching Reddit data:', error);
        return NextResponse.json({ error: 'Failed to fetch Reddit data' }, { status: 500 });
    }
}
