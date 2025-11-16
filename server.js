import express from "express";
import { Innertube } from "youtubei.js";

const app = express();

async function getShorts(channelId) {
  const yt = await Innertube.create({
    fetch: globalThis.fetch,
  });

  const channel = await yt.getChannel(channelId);

  // we need the Shorts tab
  const shortsTab = channel?.shorts;

  if (!shortsTab) return [];

  const shorts = shortsTab.videos.map(v => ({
    title: v.title.toString(),
    video_id: v.id,
    url: `https://www.youtube.com/shorts/${v.id}`,
    views: v.view_count,
    thumbnail: v.thumbnails[0]?.url || null
  }));

  return shorts;
}

app.get("/shorts", async (req, res) => {
  try {
    const channelId = req.query.channel_id;

    if (!channelId?.startsWith("UC")) {
      return res.json({
        error: "Missing or invalid ?channel_id= (must start with UC...)"
      });
    }

    const shorts = await getShorts(channelId);

    if (!shorts.length) {
      return res.json({ error: "No shorts found on this channel" });
    }

    res.json({
      channel_id: channelId,
      total_shorts: shorts.length,
      shorts
    });

  } catch (error) {
    res.json({ error: error.toString() });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("SHORTS API running on port " + port));
