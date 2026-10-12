# Media

Drop the Google Flow assets here (they are git-ignored; serve them from a CDN in production):

- `video-1.mp4` … `video-6.mp4`
- `image-1.webp` … `image-4.webp`

For the smoothest scrubbing, run `npm run encode:videos` once — it re-wraps each film
with short keyframe intervals and `faststart` without altering the footage.
