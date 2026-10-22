"""Runs a Blender scene script and turns off Cycles denoising if this Blender build
has no OpenImageDenoise (the Ubuntu apt package doesn't). Official builds don't need it.

Run (no window opens):
  blender -b -P blender/run.py -- blender/donut.py renders/donut.png
The script after "--" sees the remaining arguments as if it had been run directly.
"""
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1 :]
script = args[0]
sys.argv = [sys.argv[0], "--", *args[1:]]

def render(*a, **kw):
    scene = bpy.context.scene
    if scene.render.engine == "CYCLES" and scene.cycles.use_denoising:
        try:
            import _cycles

            has_oidn = _cycles.with_openimagedenoise
        except (ImportError, AttributeError):
            has_oidn = False
        if not has_oidn:
            print("no OpenImageDenoise in this build: rendering without denoising")
            scene.cycles.use_denoising = False
    return bpy.ops.render.render(*a, **kw)


# scripts often reset Blender (read_factory_settings), which drops a patched
# bpy.ops, so the render calls are redirected in the source instead
with open(script, encoding="utf-8") as f:
    src = f.read().replace("bpy.ops.render.render(", "_edit_tools_render(")
g = {"__name__": "__main__", "__file__": script, "_edit_tools_render": render}
exec(compile(src, script, "exec"), g)
