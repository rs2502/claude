# Media

Drop the Google Flow assets here (they are git-ignored; serve them from a CDN in production):

- `video-1.mp4` (Pasta mit Parmesan) and `video-2.mp4` (Pasta-Sorten)
- `image-1.jpeg` … `image-4.jpeg`

For the smoothest scrubbing, run `npm run encode:videos` once — it re-wraps each film
with short keyframe intervals and `faststart` without altering the footage.
