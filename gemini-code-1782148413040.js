const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const app = express();

// Enable CORS so your frontend can talk to this backend
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Endpoint to get video info (Title & Thumbnail)
app.get('/video-info', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL || !ytdl.validateURL(videoURL)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const info = await ytdl.getBasicInfo(videoURL);
        const title = info.videoDetails.title;
        const thumbnail = info.videoDetails.thumbnails[0].url;
        res.json({ title, thumbnail });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video details' });
    }
});

// Endpoint to handle the download stream
app.get('/download', async (req, res) => {
    const videoURL = req.query.url;
    if (!videoURL || !ytdl.validateURL(videoURL)) {
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        // Sanitize title for filename
        const info = await ytdl.getBasicInfo(videoURL);
        const title = info.videoDetails.title.replace(/[^\x00-\x7F]/g, "").replace(/[/\\?%*:|"<>]/g, '-');

        // Set headers to force browser download
        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        // Pipe the highest quality progressive stream (contains both video and audio up to 720p)
        ytdl(videoURL, {
            format: 'mp4',
            quality: 'highestvideo',
            filter: 'audioandvideo' 
        }).pipe(res);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing download');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});