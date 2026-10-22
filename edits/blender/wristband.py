"""Silicone training wristband with a chip module and a green status light,
rendered to a PNG with a clear background.

Run (no window opens):
  blender -b -P blender/run.py -- blender/wristband.py renders/wristband.png
"""
import math
import sys

import bpy
from mathutils import Vector

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "wristband.png"
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 1600
scene.view_settings.view_transform = "Standard"

GREEN = (0.45, 1.0, 0.0)  # #B3FF00 in linear light


def mat(name, rgb, rough=0.4, metal=0.0, coat=0.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    if emit:
        b.inputs["Emission Color"].default_value = (*rgb, 1)
        b.inputs["Emission Strength"].default_value = emit
    return m


def smooth(o, m):
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


silicone = mat("silicone", (0.11, 0.12, 0.13), rough=0.6, coat=0.15)
shell = mat("shell", (0.6, 0.62, 0.65), rough=0.25, metal=1.0)
glass = mat("glass", (0.01, 0.01, 0.012), rough=0.08, coat=1.0)
light_green = mat("led", GREEN, rough=0.2, emit=6)

# the band: an open tube, thickened and smoothed
bpy.ops.mesh.primitive_cylinder_add(
    radius=1.0, depth=0.55, vertices=128, end_fill_type="NOTHING", rotation=(math.pi / 2, 0, 0)
)
band = smooth(bpy.context.object, silicone)
band.scale = (1.0, 0.82, 1.0)  # an oval, like a wrist (local y is world z here)
band.modifiers.new("thick", "SOLIDIFY").thickness = 0.12
band.modifiers.new("smooth", "SUBSURF").levels = 2
# green edge stripes on both rims
for y in (-0.255, 0.255):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.0, minor_radius=0.024, major_segments=128, minor_segments=12,
        location=(0, y, 0), rotation=(math.pi / 2, 0, 0),
    )
    stripe = smooth(bpy.context.object, light_green)
    stripe.scale = (1.0, 0.82, 1.0)

# chip module on top of the band
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.88))
module = smooth(bpy.context.object, shell)
module.scale = (0.8, 0.5, 0.18)
bev = module.modifiers.new("bevel", "BEVEL")
bev.width, bev.segments = 0.12, 8
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.975))
face = smooth(bpy.context.object, glass)
face.scale = (0.68, 0.4, 0.02)
bev = face.modifiers.new("bevel", "BEVEL")
bev.width, bev.segments = 0.08, 6
# status light: a glowing ring with a dot in the middle
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.14, minor_radius=0.018, major_segments=64, minor_segments=12, location=(0, 0, 0.99)
)
smooth(bpy.context.object, light_green)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, location=(0, 0, 0.99))
smooth(bpy.context.object, light_green)

for name, loc, power, rgb in [
    ("key", (-3, -4, 5), 1000, (1, 1, 1)),
    ("rim", (2.5, 4, 3), 800, GREEN),
    ("fill", (4, -3, 0.5), 250, (1, 1, 1)),
]:
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
    light.data.energy, light.data.size, light.data.color = power, 4, rgb
    light.location = loc
    light.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(light)

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = 60
cam.location = (1.8, -5.2, 2.6)
target = Vector((0, 0, 0.15))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.collection.objects.link(cam)
scene.camera = cam
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("saved", out)
