import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Transform the raw YouTube data into a standardized format:
 * {
 *   items: [
 *     {
 *       title: string,
 *       description: string,
 *       thumbnail: string,
 *       url: string
 *     }
 *   ]
 * }
 */
function transformYouTubeData(rawData: any) {
  if (!rawData || !Array.isArray(rawData.items)) {
    return { items: [] };
  }

  const items = rawData.items.map((item: any) => {
    const snippet = item.snippet || {};
    const thumbnails = snippet.thumbnails || {};
    const mediumThumb = thumbnails.medium || {};
    return {
      title: snippet.title || "No title",
      description: snippet.description || "",
      thumbnail: mediumThumb.url || "",
      url: item.id?.videoId
        ? `https://www.youtube.com/watch?v=${item.id.videoId}`
        : "",
    };
  });

  return { items };
}

/**
 * Transform the raw Reddit data into a standardized format:
 * {
 *   items: [
 *     {
 *       title: string,
 *       description: string,
 *       thumbnail: string,
 *       url: string
 *     }
 *   ]
 * }
 */
function transformRedditData(rawData: any) {
  if (!rawData || !Array.isArray(rawData.posts)) {
    return { items: [] };
  }

  const items = rawData.posts.map((post: any) => {
    return {
      title: post.title || "No title",
      description: post.selftext || "",
      thumbnail: post.thumbnail || "",
      url: post.url || "",
    };
  });
  console.log(rawData.t3.data.subreddit);
  
  return { items };
}

/**
 * Transform the raw Twitter data into a standardized format:
 * {
 *   items: [
 *     {
 *       title: string,
 *       description: string,
 *       thumbnail: string,
 *       url: string
 *     }
 *   ]
 * }
 */
function transformTwitterData(rawData: any) {
  if (!rawData || !Array.isArray(rawData.tweets)) {
    return { items: [] };
  }

  const items = rawData.tweets.map((tweet: any) => {
    return {
      title: tweet.text?.slice(0, 60) + "..." || "No title",
      description: tweet.text || "",
      thumbnail: "", // If you have a media url, set it here
      url: `https://twitter.com/i/web/status/${tweet.id_str || ""}`,
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
    // Fetch data from APIs in parallel
    const [youtubeResult, redditResult, twitterResult] = await Promise.allSettled([
      axios.get(`http://localhost:3000/api/youtube/${topic}`),
      axios.get(`http://localhost:3000/api/reddit/${topic}`),
      axios.get(`http://localhost:3000/api/twitter/${topic}`)
    ]);

    // If a promise is fulfilled, transform the data. Otherwise, null.
    const youtubeData =
      youtubeResult.status === 'fulfilled' ? transformYouTubeData(youtubeResult.value.data) : null;
    const redditData =
      redditResult.status === 'fulfilled' ? transformRedditData(redditResult.value.data) : null;
    const twitterData =
      twitterResult.status === 'fulfilled' ? transformTwitterData(twitterResult.value.data) : null;

    // Aggregate data from each platform in the standardized shape
    const aggregatedData = {
      youtube: youtubeData,
      reddit: redditData,
      twitter: twitterData,
    };

    // Build a prompt with available data from all platforms
    const platformPrompt = `
Summarize the data from the following platforms:

**YouTube:** ${youtubeData ? JSON.stringify(youtubeData) : "No data available"}
**Reddit:** ${redditData ? JSON.stringify(redditData) : "No data available"}
**Twitter:** ${twitterData ? JSON.stringify(twitterData) : "No data available"}
    `;

    // If any platform data is missing, add a fallback instruction to generate comprehensive content on the topic.
    const missingData = !youtubeData || !redditData || !twitterData;
    const fallbackPrompt = missingData
      ? `Also, generate comprehensive content on the topic "${topic}" covering recent trends, analysis, and public opinion.`
      : "";

    // Append an instruction to mention posts/topics/links used to generate the summary.
    const referencesInstruction =
      "Finally, after summarizing, list the posts, topics, or links that were used to generate this summary.";

    const promptText = `${fallbackPrompt}
${platformPrompt}
${referencesInstruction}`;

    // Prepare request body for Vertex AI Gemini's generateContent endpoint
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

    // Use environment variables for the Gemini model name and API key.
    // The API key is passed as a query parameter.
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-8b-exp-0827';
    const apiKey = process.env.GEMINI_API_KEY;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const summaryResponse = await axios.post(endpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extract the generated summary
    const candidate = summaryResponse.data.candidates[0];
    const summary = candidate.output || candidate.content?.parts[0]?.text || '';

    return NextResponse.json({ summary, aggregatedData });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
