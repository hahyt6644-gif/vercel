import express from "express";
import Parser from "rss-parser";

const app = express();
const parser = new Parser();

app.get("/", (req, res) => {
  res.json({ status: "YouTube Latest API Running" });
});

// Endpoint: /latest?username=MrBeast
app.get("/latest", async (req, res) => {
  try {
    const username = req.query.username;

    if (!username) {
      return res.status(400).json({ error: "Missing ?username=" });
    }

    // YouTube RSS feed (never breaks)
    const url = `https://www.youtube.com/feeds/videos.xml?user=${username}`;

    const feed = await parser.parseURL(url);

    if (!feed.items || feed.items.length === 0) {
      return res.json({ error: "Channel not found or no videos" });
    }

    const latest = feed.items[0];
    const id = latest.id.replace("yt:video:", "");

    res.json({
      channel: username,
      title: latest.title,
      video_id: id,
      url: `https://www.youtube.com/watch?v=${id}`
    });

  } catch (err) {
    res.json({ error: String(err) });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port", port));
