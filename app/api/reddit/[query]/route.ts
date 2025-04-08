import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

interface RedditPost {
    title: string;
    selftext?: string;
    thumbnail?: string;
    url?: string;
}

interface RedditAPIResponse {
    data: {
        children: { data: RedditPost }[];
    };
}
interface Props{
    params: {
        query: string;
    };
}

export async function GET(
    request: NextRequest,
    // { params }: { params: { query: string } }
    { params }: Props
) {
    const { query } = params;
    console.log("Reddit API received query:", query);

    if (!query) {
        return NextResponse.json(
            { error: 'No query provided' },
            { status: 400 }
        );
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

        const redditData = response.data;
        console.log("Full Reddit response:", redditData);
        const children = redditData?.data?.children;

        if (!Array.isArray(children)) {
            console.error("Unexpected Reddit response structure for query:", query, redditData);
            return NextResponse.json({ error: 'Unexpected response structure from Reddit' }, { status: 500 });
        }

        if (children.length === 0) {
            console.warn("Empty Reddit posts array for query:", query);
        }

        const items: RedditPost[] = children.map((child) => {
            const post = child.data;
            return {
                title: post.title || "No title",
                selftext: post.selftext || "",
                thumbnail:
                    post.thumbnail && typeof post.thumbnail === 'string' && post.thumbnail.startsWith('http')
                        ? post.thumbnail
                        : "",
                url: post.url || "",
            };
        });

        return NextResponse.json({ items });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error('Error fetching Reddit data:', axiosError.message, axiosError.response?.status, axiosError.response?.data);
            return NextResponse.json({ error: `Failed to fetch Reddit data: ${axiosError.message}` }, { status: 500 });
        } else {
            console.error('Error fetching Reddit data:', error);
            return NextResponse.json({ error: 'Failed to fetch Reddit data' }, { status: 500 });
        }
    }
}