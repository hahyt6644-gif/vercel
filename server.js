import express from "express";
import { Innertube } from "youtubei.js";

const app = express();

// Initialize YouTube client once
let yt;
async function initYT() {
  if (!yt) {
    yt = await Innertube.create({
      client_type: "WEB_REMIX",
      enable_safety_mode: false,
      fetch: (...args) => fetch(...args)
    });

    console.log("YouTube client loaded");
  }
}

// Root check
app.get("/", (req, res) => {
  res.json({ status: "YouTube Latest Downloader API is running" });
});

// MAIN ENDPOINT → Get latest video + download link
app.get("/latest", async (req, res) => {
  try {
    const username = req.query.username;
    if (!username)
      return res.status(400).json({ error: "Missing ?username=" });

    await initYT();

    // Get channel info via @handle
    const channel = await yt.getChannel(`@${username}`);

    // Latest uploaded video
    const latest = channel.videos[0];
    const videoId = latest.id;

    // Fetch full video info
    const info = await yt.getInfo(videoId);

    // All playable formats
    const formats = [
      ...info.streaming_data.formats,
      ...info.streaming_data.adaptive_formats
    ];

    // Pick best quality with URL
    const best = formats
      .filter(f => f.url && f.height)
      .sort((a, b) => b.height - a.height)[0];

    if (!best)
      return res.status(500).json({ error: "No downloadable formats available" });

    // Response
    res.json({
      title: latest.title.text,
      id: videoId,
      download_url: best.url
    });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port " + port));
