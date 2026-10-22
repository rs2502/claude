"""Cast-iron kettlebell with a green stripe, rendered to a PNG with a clear background.

Run (no window opens):
  blender -b -P blender/run.py -- blender/kettlebell.py renders/kettlebell.png
"""
import math
import sys

import bpy
from mathutils import Vector

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "kettlebell.png"
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


iron = mat("iron", (0.025, 0.027, 0.03), rough=0.38, metal=0.6, coat=0.5)
green = mat("green", GREEN, rough=0.3, emit=1.5)

# body: a slightly squashed sphere sitting on a flat foot
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=96, ring_count=48, location=(0, 0, 0))
body = smooth(bpy.context.object, iron)
body.scale = (1, 1, 0.93)
bpy.ops.mesh.primitive_cylinder_add(radius=0.62, depth=0.12, vertices=96, location=(0, 0, -0.9))
smooth(bpy.context.object, iron).modifiers.new("bevel", "BEVEL").width = 0.04

# handle: a torus standing upright, its lower half hidden inside the body
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.78, minor_radius=0.13, major_segments=96, minor_segments=32,
    location=(0, 0, 0.78), rotation=(math.pi / 2, 0, 0),
)
handle = smooth(bpy.context.object, iron)
handle.scale = (1, 0.72, 1)  # wider than tall, like a real kettlebell
# two posts where the handle meets the body
for x in (-0.76, 0.76):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.4, vertices=48, location=(x, 0, 0.62))
    smooth(bpy.context.object, iron)

# glowing brand stripe around the belly
bpy.ops.mesh.primitive_torus_add(
    major_radius=1.0, minor_radius=0.035, major_segments=128, minor_segments=16, location=(0, 0, -0.08)
)
smooth(bpy.context.object, green)

for name, loc, power, rgb in [
    ("key", (-3, -4, 5), 1100, (1, 1, 1)),
    ("rim", (2.5, 4, 3), 900, GREEN),
    ("fill", (4, -3, 0.5), 250, (1, 1, 1)),
]:
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
    light.data.energy, light.data.size, light.data.color = power, 4, rgb
    light.location = loc
    light.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(light)

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = 60
cam.location = (2.4, -6.2, 2.4)
target = Vector((0, 0, 0.25))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.collection.objects.link(cam)
scene.camera = cam
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("saved", out)
