import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

interface TwitterPost {
    text: string;
    id_str: string;
}

interface TwitterAPIResponse {
    statuses: TwitterPost[];
}

export const runtime = 'nodejs';

export async function GET(context: { params: { query: string } }) {
    const { query } = context.params;
    console.log("Twitter API received query:", query);

    if (!query) {
        return NextResponse.json({ error: 'No query provided' }, { status: 400 });
    }

    try {
        const bearerToken = process.env.TWITTER_BEARER_TOKEN;
        if (!bearerToken) {
            console.error("Twitter Bearer Token is missing.");
            return NextResponse.json({ error: 'Twitter API key is missing' }, { status: 500 });
        }

        const response = await axios.get<TwitterAPIResponse>('https://api.twitter.com/1.1/search/tweets.json', {
            params: {
                q: query,
                count: 5,
            },
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
            },
        });

        const twitterData = response.data;
        console.log("Full Twitter response:", twitterData);

        const items = twitterData.statuses.map((status) => ({
            text: status.text || "No text",
            id_str: status.id_str || "",
        }));

        return NextResponse.json({ items });

    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            const errorMessage = `Failed to fetch Twitter data: ${axiosError.message}, Status: ${axiosError.response?.status}`;
            console.error('Error fetching Twitter data:', errorMessage, axiosError.response?.data);
            return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        console.error('Error fetching Twitter data:', error);
        return NextResponse.json({ error: 'Failed to fetch Twitter data' }, { status: 500 });
    }
}
