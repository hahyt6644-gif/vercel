import express from "express";
import Parser from "rss-parser";
import fetch from "node-fetch";

const app = express();
const parser = new Parser();

// Get channelId from ANY username or handle
async function getChannelId(input) {
  const handle = input.startsWith("@") ? input : `@${input}`;

  const url = `https://www.youtube.com/${handle}`;
  const html = await fetch(url).then(r => r.text());

  const match = html.match(/"channelId":"(UC[0-9A-Za-z_-]{22})"/);

  return match ? match[1] : null;
}

app.get("/latest", async (req, res) => {
  try {
    const uname = req.query.username;
    if (!uname) return res.json({ error: "Missing ?username=" });

    // Step 1: Resolve channelId
    const channelId = await getChannelId(uname);

    if (!channelId) {
      return res.json({ error: "Channel not found" });
    }

    // Step 2: Fetch RSS feed
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(feedUrl);

    if (!feed.items.length) {
      return res.json({ error: "No videos found" });
    }

    // Step 3: Extract latest video
    const latest = feed.items[0];
    const videoId = latest.id.replace("yt:video:", "");

    res.json({
      input: uname,
      channel_id: channelId,
      channel_title: feed.title,
      title: latest.title,
      video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });

  } catch (error) {
    res.json({ error: String(error) });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "YouTube Latest Video API is Running" });
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port " + port));
