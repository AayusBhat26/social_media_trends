"use client";
import { useState, FormEvent } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface PlatformItem {
  title: string;
  description: string;
  thumbnail: string;
  url: string;
}

interface AggregatedData {
  youtube?: { items: PlatformItem[] } | PlatformItem[];
  twitter?: { items: PlatformItem[] } | PlatformItem[];
}

interface TrendsData {
  summary?: string;
  aggregatedData?: AggregatedData;
}

function renderPlatformData(
  platform: string,
  data: { items?: PlatformItem[] } | PlatformItem[] | undefined
) {
  if (!data) {
    console.warn(`${platform}: No data available.`);
    return <p className="text-gray-500">No data available.</p>;
  }

  let items: PlatformItem[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else if ("items" in data && Array.isArray(data.items)) {
    items = data.items;
  } else {
    items = [data as PlatformItem];
  }
  console.log(`${platform} items:`, items);
  if (items.length === 0) {
    return <p className="text-gray-500">No items available.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="rounded-lg bg-gray-800 p-4 shadow-lg hover:shadow-2xl transition"
        >
          {item.thumbnail && item.thumbnail !== "self" && (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="mb-2 h-40 w-full object-cover rounded"
            />
          )}
          <h3 className="mb-1 text-lg font-semibold text-white">
            {item.title || "No title"}
          </h3>
          {item.description && (
            <p className="mb-2 text-sm text-gray-300 line-clamp-3">
              {item.description}
            </p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-400 hover:underline"
            >
              View Details
            </a>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [trends, setTrends] = useState<TrendsData>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [redditPosts, setRedditPosts] = useState<PlatformItem[]>([]);
  const [redditLoading, setRedditLoading] = useState(false);
  const [redditError, setRedditError] = useState("");

  const fetchTrends = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/api/trends?q=${encodeURIComponent(query)}`);
      setTrends(res.data);
      console.log("Fetched Trends:", res.data);
      await loadRedditData();
    } catch (err) {
      console.error("Error fetching trends:", err);
      setError("Failed to fetch trends. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadRedditData = async () => {
    if (!query.trim()) return;
    setRedditLoading(true);
    setRedditError("");
    try {
      const res = await axios.get(`/api/reddit/${encodeURIComponent(query)}`);
      console.log("Fetched Reddit API response:", res.data);
      let items: PlatformItem[] = [];
      if (res.data && res.data.items && Array.isArray(res.data.items)) {
        items = res.data.items;
      } else if (Array.isArray(res.data)) {
        items = res.data;
      } else {
        console.warn("Unexpected Reddit response format", res.data);
      }
      setRedditPosts(items);
    } catch (err) {
      console.error("Error fetching Reddit data:", err);
      setRedditError("Failed to load Reddit data.");
      setRedditPosts([]);
    } finally {
      setRedditLoading(false);
    }
  };

  const { aggregatedData } = trends;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black p-4 sm:p-8 hide-scrollbar"
    >
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <header className="mb-8 text-center">
          <motion.h1
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-3xl font-bold text-white sm:text-4xl"
          >
            Social Media Trends Analysis
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-2 text-base text-gray-400 sm:text-lg"
          >
            Explore trends and receive comprehensive summaries.
          </motion.p>
        </header>

        {/* Search Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6 rounded-lg bg-gray-800 p-6 shadow-lg"
        >
          <motion.form
            onSubmit={fetchTrends}
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <label htmlFor="query" className="sr-only">
              Search Topic
            </label>
            <input
              id="query"
              type="text"
              placeholder="Enter a topic..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-1"
            />
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              {loading ? "Searching..." : "Search"}
            </motion.button>
          </motion.form>
          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 rounded-lg bg-red-100 p-4 text-center text-red-700"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Summary Card */}
        {trends.summary && (
          <motion.section
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            aria-label="Summary Section"
            className="rounded-lg bg-gray-800 p-6 shadow-lg"
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4 text-2xl font-semibold text-white"
            >
              Summary
            </motion.h2>
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="prose max-w-none rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-300"
            >
              <ReactMarkdown>{trends.summary}</ReactMarkdown>
            </motion.div>
          </motion.section>
        )}

        {/* Aggregated Data Section */}
        {aggregatedData && (
          <motion.section
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            aria-label="Source Data"
            className="mt-8 rounded-lg bg-gray-800 p-6 shadow-lg"
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4 text-2xl font-semibold text-white"
            >
              Source Data
            </motion.h2>
            <div className="space-y-8">
              <div>
                <h3 className="mb-2 text-xl font-medium text-gray-300">
                  YouTube
                </h3>
                {renderPlatformData("YouTube", aggregatedData.youtube)}
              </div>
              <div>
                <h3 className="mb-2 text-xl font-medium text-gray-300">
                  Twitter
                </h3>
                {renderPlatformData("Twitter", aggregatedData.twitter)}
              </div>
            </div>
          </motion.section>
        )}

        {/* Reddit Feed */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          aria-label="Reddit Feed"
          className="mt-8 rounded-lg bg-gray-800 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-semibold text-white"
            >
              Reddit Feed
            </motion.h2>
            <motion.button
              onClick={loadRedditData}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition"
              disabled={redditLoading}
            >
              {redditLoading ? "Loading..." : "Reload Reddit"}
            </motion.button>
          </div>
          {redditError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-red-600 mb-4"
            >
              {redditError}
            </motion.p>
          )}
          {redditPosts.length === 0 && !redditLoading && (
            <p className="text-gray-500">No Reddit posts available.</p>
          )}
          {redditPosts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {redditPosts.map((post, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="rounded-lg bg-gray-700 p-4 shadow hover:shadow-xl transition"
                >
                  {post.thumbnail && post.thumbnail !== "self" && (
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="mb-2 h-40 w-full object-cover rounded"
                    />
                  )}
                  <h3 className="mb-1 text-lg font-semibold text-white">
                    {post.title || "No title"}
                  </h3>
                  {post.description && (
                    <p className="mb-2 text-sm text-gray-300 line-clamp-3">
                      {post.description}
                    </p>
                  )}
                  {post.url && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-400 hover:underline"
                    >
                      View Details
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </motion.main>
  );
}
