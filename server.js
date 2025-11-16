import express from "express";
import { Innertube } from "youtubei.js";

const app = express();

let yt;

async function initYT() {
  if (!yt) {
    yt = await Innertube.create({
      client_type: "WEB", // ← NO SIGNATURE DECIPHER NEEDED
      enable_safety_mode: false,
      fetch: (input, init) => globalThis.fetch(input, init)
    });

    console.log("YouTube client loaded");
  }
}

app.get("/", (req, res) => {
  res.json({ status: "YT API Working" });
});

app.get("/latest", async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: "Missing username" });

    await initYT();

    const channel = await yt.getChannel(`@${username}`);
    const latest = channel.videos[0];
    const videoId = latest.id;

    const info = await yt.getInfo(videoId);

    // No signature decipher needed, get direct URLs only
    const urls = [];

    if (info.streaming_data?.formats) {
      info.streaming_data.formats.forEach(f => {
        if (f.url) urls.push({ quality: f.qualityLabel, url: f.url });
      });
    }

    if (!urls.length) return res.json({ error: "No downloadable formats" });

    res.json({
      channel: username,
      title: latest.title.text,
      video_id: videoId,
      downloads: urls
    });

  } catch (err) {
    res.json({ error: String(err) });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port", port));
