import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
    request: NextRequest,
    { params }: { params: { query: string } }
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
        const response = await axios.get('https://www.reddit.com/search.json', {
            params: {
                q: query,
                sort: 'relevance',
                limit: 5,
            },
            headers: {
                'User-Agent': 'NextJSApp/1.0 (by /u/DegreeMission1678)',
            },
        });

        console.log("Full Reddit response:", response.data);
        const children = response.data?.data?.children;

        if (!Array.isArray(children)) {
            console.error("Unexpected Reddit response structure for query:", query, response.data);
            return NextResponse.json({ error: 'Unexpected response structure from Reddit' }, { status: 500 });
        }
        if (children.length === 0) {
            console.warn("Empty Reddit posts array for query:", query);
        }

        const items = children.map((child: { data: { title: string; selftext?: string; thumbnail?: string; [key: string]: unknown } }) => {
            const post = child.data;
            return {
                title: post.title || "No title",
                description: post.selftext || "",
                thumbnail:
                    post.thumbnail && typeof post.thumbnail === 'string' && post.thumbnail.startsWith('http')
                        ? post.thumbnail
                        : "",
                url: post.url || "",
            };
        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Error fetching Reddit data:', error);
        return NextResponse.json({ error: 'Failed to fetch Reddit data' }, { status: 500 });
    }
}
