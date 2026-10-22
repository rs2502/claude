"""Week calendar (MO to SO) on a ring-bound board, rendered to a PNG with a clear background.
Days given after the output path light up green, for example "MO DO".

Run (no window opens):
  blender -b -P blender/run.py -- blender/calendar.py renders/calendar.png
  blender -b -P blender/run.py -- blender/calendar.py renders/calendar-2x.png MO DO
"""
import math
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
out = args[0] if args else "calendar.png"
lit = {d.upper() for d in args[1:]}
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 1600
scene.view_settings.view_transform = "Standard"

GREEN = (0.45, 1.0, 0.0)  # #B3FF00 in linear light
DAYS = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]


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


def box(name, size, loc, m, bevel=0.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    o.data.materials.append(m)
    b = o.modifiers.new("bevel", "BEVEL")
    b.width, b.segments = bevel, 6
    return o


def label(text, loc, m, size=0.24):
    bpy.ops.object.text_add(location=loc, rotation=(math.pi / 2, 0, 0))
    t = bpy.context.object
    t.data.body = text
    t.data.size = size
    t.data.align_x, t.data.align_y = "CENTER", "CENTER"
    t.data.extrude = 0.01
    t.data.materials.append(m)
    return t


board_m = mat("board", (0.9, 0.9, 0.88), rough=0.45, coat=0.3)
header_m = mat("header", (0.03, 0.035, 0.04), rough=0.4, coat=0.4)
tile_m = mat("tile", (0.78, 0.79, 0.8), rough=0.5)
lit_m = mat("lit", GREEN, rough=0.3, emit=2.5)
dark_text = mat("dark text", (0.05, 0.05, 0.06), rough=0.5)
white_text = mat("white text", (1, 1, 1), rough=0.5)
ring_m = mat("ring", (0.7, 0.72, 0.75), rough=0.2, metal=1.0)

W, H = 4.4, 2.5
box("board", (W, 0.14, H), (0, 0, 0), board_m, bevel=0.12)
box("header", (W, 0.16, 0.55), (0, -0.01, H / 2 - 0.27), header_m, bevel=0.1)
label("WOCHE", (0, -0.1, H / 2 - 0.27), lit_m, size=0.3)
for x in (-1.4, -0.5, 0.5, 1.4):  # binding rings over the top edge
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.16, minor_radius=0.035, major_segments=48, minor_segments=12,
        location=(x, 0, H / 2 + 0.02), rotation=(0, math.pi / 2, 0),
    )
    bpy.context.object.data.materials.append(ring_m)

tile_w, gap = 0.5, 0.08
x0 = -(7 * tile_w + 6 * gap) / 2 + tile_w / 2
for i, day in enumerate(DAYS):
    x = x0 + i * (tile_w + gap)
    on = day in lit
    box(f"tile {day}", (tile_w, 0.1, 1.3), (x, -0.1, -0.25), lit_m if on else tile_m, bevel=0.06)
    label(day, (x, -0.17, 0.12), dark_text, size=0.2)
    if on:  # a check mark made of two bars
        for (dx, dz, ang, ln) in [(-0.07, -0.42, 45, 0.18), (0.088, -0.34, -55, 0.34)]:
            bpy.ops.mesh.primitive_cube_add(size=1, location=(x + dx, -0.17, dz), rotation=(0, math.radians(ang), 0))
            c = bpy.context.object
            c.scale = (ln, 0.03, 0.06)
            c.data.materials.append(white_text)

for name, loc, power, rgb in [
    ("key", (-3, -5, 4), 1100, (1, 1, 1)),
    ("rim", (2.5, 4, 3), 600, GREEN),
    ("fill", (4, -4, 0.5), 300, (1, 1, 1)),
]:
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
    light.data.energy, light.data.size, light.data.color = power, 4, rgb
    light.location = loc
    light.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(light)

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.lens = 50
cam.location = (1.6, -7.2, 1.6)
target = Vector((0, 0, -0.05))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.collection.objects.link(cam)
scene.camera = cam
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("saved", out)
