// File: route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface PlatformItem {
    title: string;
    description: string;
    thumbnail: string;
    url: string;
}

function transformYouTubeData(rawData: unknown) {
    const data = rawData as {
        items?: Array<{
            snippet?: {
                title?: string;
                description?: string;
                thumbnails?: { medium?: { url?: string } };
            };
            id?: { videoId?: string };
        }>;
    };
    if (!data || !Array.isArray(data.items)) {
        return { items: [] as PlatformItem[] };
    }

    const items = data.items.map((item) => {
        const snippet = item.snippet || {};
        const thumbnails = snippet.thumbnails || {};
        const mediumThumb = thumbnails.medium || {};
        return {
            title: snippet.title || "No title",
            description: snippet.description || "",
            thumbnail: mediumThumb.url || "",
            url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : "",
        };
    });

    return { items };
}

function transformRedditData(rawData: unknown) {
    const data = rawData as { posts?: Array<{ 
        title?: string; 
        selftext?: string; 
        thumbnail?: string; 
        url?: string;
        [key: string]: unknown;
    }> };
    if (!data || !Array.isArray(data.posts)) {
        return { items: [] as PlatformItem[] };
    }

    const items = data.posts.map((post) => {
        return {
            title: post.title || "No title",
            description: post.selftext || "",
            thumbnail: post.thumbnail || "",
            url: post.url || "",
        };
    });

    return { items };
}

function transformTwitterData(rawData: unknown) {
    const data = rawData as { tweets?: Array<{ 
        id_str?: string; 
        text?: string; 
        [key: string]: unknown;
    }> };
    if (!data || !Array.isArray(data.tweets)) {
        return { items: [] as PlatformItem[] };
    }

    const items = data.tweets.map((tweet) => {
        return {
            title: tweet.text ? tweet.text.slice(0, 60) + "..." : "No title",
            description: tweet.text || "",
            thumbnail: "",
            url: tweet.id_str ? `https://twitter.com/i/web/status/${tweet.id_str}` : "",
        };
    });

    return { items };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('q');

    if (!topic) {
        return NextResponse.json({ error: 'No topic provided' }, { status: 400 });
    }

    try {
        const [youtubeResult, redditResult, twitterResult] = await Promise.allSettled([
            axios.get(`http://localhost:3000/api/youtube/${topic}`),
            axios.get(`http://localhost:3000/api/reddit/${topic}`),
            axios.get(`http://localhost:3000/api/twitter/${topic}`)
        ]);

        const youtubeData =
            youtubeResult.status === 'fulfilled'
                ? transformYouTubeData(youtubeResult.value.data)
                : null;
        const redditData =
            redditResult.status === 'fulfilled'
                ? transformRedditData(redditResult.value.data)
                : null;
        const twitterData =
            twitterResult.status === 'fulfilled'
                ? transformTwitterData(twitterResult.value.data)
                : null;

        const aggregatedData = {
            youtube: youtubeData,
            reddit: redditData,
            twitter: twitterData,
        };

        const platformPrompt = `
Summarize the data from the following platforms:

**YouTube:** ${youtubeData ? JSON.stringify(youtubeData) : "No data available"}
**Reddit:** ${redditData ? JSON.stringify(redditData) : "No data available"}
**Twitter:** ${twitterData ? JSON.stringify(twitterData) : "No data available"}
        `;

        const missingData = !youtubeData || !redditData || !twitterData;
        const fallbackPrompt = missingData
            ? `Also, generate comprehensive content on the topic "${topic}" covering recent trends, analysis, and public opinion.`
            : "";

        const referencesInstruction =
            "Finally, after summarizing, list the posts, topics, or links that were used to generate this summary.";

        const promptText = `${fallbackPrompt}
${platformPrompt}
${referencesInstruction}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: promptText }
                    ]
                }
            ],
            generation_config: {
                max_output_tokens: 500,
                temperature: 1,
                topP: 0.95,
                topK: 40,
            }
        };

        const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-8b-exp-0827';
        const apiKey = process.env.GEMINI_API_KEY;
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const summaryResponse = await axios.post(endpoint, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const candidate = summaryResponse.data.candidates[0];
        const summary = candidate.output || candidate.content?.parts[0]?.text || '';

        return NextResponse.json({ summary, aggregatedData });
    } catch (error) {
        console.error('Error fetching trends:', error);
        return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }
}