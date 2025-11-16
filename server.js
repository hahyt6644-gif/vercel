import express from "express";
import Parser from "rss-parser";

const app = express();
const parser = new Parser();

// 🟢 Get latest video using ONLY channel ID
app.get("/latest", async (req, res) => {
  try {
    const channelId = req.query.channel_id;

    if (!channelId || !channelId.startsWith("UC")) {
      return res.status(400).json({
        error: "Missing or invalid ?channel_id= (must start with UC...)"
      });
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(feedUrl);

    if (!feed.items.length) {
      return res.json({ error: "No videos found" });
    }

    const latest = feed.items[0];
    const videoId = latest.id.replace("yt:video:", "");

    res.json({
      channel_id: channelId,
      channel_title: feed.title,
      title: latest.title,
      video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });

  } catch (err) {
    res.json({ error: String(err) });
  }
});

// 🟢 Get ALL videos YouTube RSS provides (max 15)
app.get("/allvideos", async (req, res) => {
  try {
    const channelId = req.query.channel_id;

    if (!channelId || !channelId.startsWith("UC")) {
      return res.status(400).json({
        error: "Missing or invalid ?channel_id= (must start with UC...)"
      });
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(feedUrl);

    const videos = feed.items.map(item => ({
      title: item.title,
      video_id: item.id.replace("yt:video:", ""),
      url: `https://www.youtube.com/watch?v=${item.id.replace("yt:video:", "")}`
    }));

    res.json({
      channel_id: channelId,
      channel_title: feed.title,
      total_videos: videos.length,
      videos
    });

  } catch (err) {
    res.json({ error: String(err) });
  }
});

// root
app.get("/", (req, res) => {
  res.json({ status: "YouTube API using Channel ID is running" });
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port " + port));
