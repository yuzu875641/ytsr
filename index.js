// index.js

const express = require('express');
const ytsr = require('ytsr');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/v1/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const filters = await ytsr.getFilters(query);
    const filter = filters.get('Type').get('Video');
    const searchResults = await ytsr(filter.url, { limit: 10 });

    const invidiousFormatResults = searchResults.items.map(item => {
      let formattedItem = {
        type: item.type === 'video' ? 'video' : 'live',
        title: item.title,
        videoId: item.id,
        videoThumbnails: item.thumbnails.map(thumbnail => ({
          quality: `${thumbnail.width}x${thumbnail.height}`,
          url: thumbnail.url,
          width: thumbnail.width,
          height: thumbnail.height
        })),
        lengthSeconds: item.duration ? parseDurationToSeconds(item.duration) : null,
        viewCount: item.views,
        author: item.author.name,
        authorId: item.author.channelID,
        liveNow: item.isLive
      };
      return formattedItem;
    });

    res.status(200).json(invidiousFormatResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'An error occurred during the search.' });
  }
});

function parseDurationToSeconds(duration) {
  if (!duration) return null;
  const parts = duration.split(':').map(Number);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
