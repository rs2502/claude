"""Turns any still-object script into an orbit animation: the camera circles the object
while everything else stays as the script built it. Writes a PNG sequence with alpha.

Run (no window opens):
  blender -b -P blender/orbit.py -- blender/kettlebell.py renders/kb/ [frames] [degrees] [size] [samples]
Defaults: 60 frames, 360 degrees, 900 px, 48 samples. Then for HyperFrames (VP9 keeps alpha):
  ffmpeg -framerate 30 -i renders/kb/%04d.png -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 kb.webm
"""
import math
import os
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1 :]
script, outdir = args[0], args[1]
frames = int(args[2]) if len(args) > 2 else 60
degrees = float(args[3]) if len(args) > 3 else 360
size = int(args[4]) if len(args) > 4 else 900
samples = int(args[5]) if len(args) > 5 else 48
os.makedirs(outdir, exist_ok=True)


def orbit_render(*a, **kw):
    """Replaces the still render: keyframe the camera around the Z axis, render the sequence."""
    scene = bpy.context.scene
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    try:
        import _cycles

        if not _cycles.with_openimagedenoise:
            scene.cycles.use_denoising = False
    except (ImportError, AttributeError):
        scene.cycles.use_denoising = False
    cam = scene.camera
    pivot = bpy.data.objects.new("pivot", None)
    scene.collection.objects.link(pivot)
    cam.parent = pivot
    scene.frame_start, scene.frame_end = 1, frames
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert("rotation_euler", frame=1)
    # one step past the last frame, so a full turn loops without a repeated frame
    pivot.rotation_euler = (0, 0, math.radians(degrees) * frames / max(frames - 1, 1))
    pivot.keyframe_insert("rotation_euler", frame=frames + 1)
    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR" if degrees >= 360 else "BEZIER"
    scene.render.filepath = os.path.join(outdir, "")
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    bpy.ops.render.render(animation=True)


with open(script, encoding="utf-8") as f:
    src = f.read().replace("bpy.ops.render.render(", "_orbit_render(")
exec(compile(src, script, "exec"), {"__name__": "__main__", "__file__": script, "_orbit_render": orbit_render})
print("saved", outdir)
