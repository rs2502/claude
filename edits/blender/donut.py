"""Blender test and pattern: a glossy toy donut rendered to a PNG with a clear background.
Part of the Claude Code edit setup by Kapa (@kappa.ai).

Run (no window opens):
  <blender> -b -P blender/donut.py -- renders/donut.png
New objects follow the same pattern: build meshes, add materials, light, camera, render.
"""
import math
import random
import sys

import bmesh
import bpy
from mathutils import Vector

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "donut.png"
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 800
scene.view_settings.view_transform = "Standard"


def mat(name, rgb, rough=0.3):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = 0.4
    return m


def smooth(o, m):
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


# a fine mesh keeps curves smooth: coarse meshes look blocky (like LEGO)
TORUS = dict(major_radius=1, major_segments=96, minor_segments=48)
bpy.ops.mesh.primitive_torus_add(minor_radius=0.46, **TORUS)
smooth(bpy.context.object, mat("dough", (0.75, 0.38, 0.12), 0.55))
bpy.ops.mesh.primitive_torus_add(minor_radius=0.475, **TORUS)
icing = bpy.context.object
bm = bmesh.new()
bm.from_mesh(icing.data)
for v in list(bm.verts):
    ang = math.atan2(v.co.y, v.co.x)
    drip = 0.02 + 0.09 * math.sin(ang * 7) + 0.05 * math.sin(ang * 13 + 1.3)
    if v.co.z < drip:  # icing covers the top, the wavy edge makes soft drips
        bm.verts.remove(v)
bm.to_mesh(icing.data)
bm.free()
icing.modifiers.new("thick", "SOLIDIFY").thickness = 0.035
icing.modifiers.new("smooth", "SUBSURF").levels = 1
smooth(icing, mat("icing", (1.0, 0.2, 0.45), 0.2))
rnd = random.Random(7)
colors = [(1, 1, 1), (0.1, 0.7, 1), (1, 0.75, 0.1), (0.4, 0.2, 1)]
for i in range(60):
    a, r = rnd.uniform(0, math.tau), 1 + rnd.uniform(-0.28, 0.28)
    z = math.sqrt(max(0, 0.475**2 - (r - 1) ** 2)) + 0.03
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.022, depth=0.13, vertices=8, location=(math.cos(a) * r, math.sin(a) * r, z)
    )
    s = bpy.context.object
    s.rotation_euler = (math.pi / 2, 0, rnd.uniform(0, math.pi))
    smooth(s, mat(f"sprinkle{i}", colors[i % 4]))

for name, loc, power in [("key", (-3, -4, 5), 900), ("fill", (4, -3, 1.5), 300), ("rim", (1, 5, 3), 600)]:
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
    light.data.energy, light.data.size = power, 4
    light.location = loc
    light.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(light)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.location = (0, -5.2, 3.6)
cam.rotation_euler = (Vector((0, 0, 0)) - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.collection.objects.link(cam)
scene.camera = cam
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("saved", out)
