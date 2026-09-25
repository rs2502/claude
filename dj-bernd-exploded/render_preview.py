"""Headless EEVEE preview render -> dj_bernd_exploded_preview.mp4 (does not modify the .blend).
    blender -b dj_bernd_exploded.blend --python render_preview.py -- [percent] [samples] [start] [end] [out]"""
import sys
import bpy

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
pct, samples = int(args[0]) if args else 50, int(args[1]) if len(args) > 1 else 16
s = bpy.context.scene
if len(args) > 3:
    s.frame_start, s.frame_end = int(args[2]), int(args[3])
s.render.resolution_percentage = pct
s.eevee.taa_render_samples = samples
s.render.image_settings.file_format = "FFMPEG"
s.render.ffmpeg.format, s.render.ffmpeg.codec = "MPEG4", "H264"
s.render.ffmpeg.constant_rate_factor = "HIGH"
s.render.filepath = args[4] if len(args) > 4 else "//dj_bernd_exploded_preview.mp4"
bpy.ops.render.render(animation=True)
print("PREVIEW DONE", bpy.path.abspath(s.render.filepath))
