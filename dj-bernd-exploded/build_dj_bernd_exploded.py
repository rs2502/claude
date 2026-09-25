"""DJ Bernd – exploded-view reel of a generic 2-channel DJ controller.

Builds the whole scene from primitives (Blender 4.2+ / tested with 4.5 LTS).
Run through the higgsfield-use-blender MCP (bl_execute) or headless:
    blender -b --python build_dj_bernd_exploded.py

Controls (object "CTRL_Explode", Object Properties > Custom Properties):
    explode_width   distance in metres between two exploded layers
    explode_amount  global multiplier 0..1 (0 = never explodes)
    layer_1..6      per-layer 0..1, keyframed = the staggered timing
Every part carries its own "explode_layer" / "explode_offset" properties. The
explosion lives on delta_location Z via simple-expression drivers, so the
regular Location stays free to edit and nothing is baked.
"""
import math

import bmesh
import bpy
from mathutils import Vector

FPS = 30
FRAME_START, FRAME_END = 1, 450  # 15 s


def f(sec):
    """Seconds -> frame number (frame 1 == 0.0 s)."""
    return int(round(FRAME_START + sec * FPS))


# ---------------------------------------------------------------- reset
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for coll in list(bpy.data.collections):
    bpy.data.collections.remove(coll)
for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.actions):
    for item in list(block):
        block.remove(item)

scene = bpy.context.scene
scene.name = "DJ_Bernd_Exploded"
scene.frame_start, scene.frame_end = FRAME_START, FRAME_END
scene.render.fps = FPS
scene.render.resolution_x, scene.render.resolution_y = 1080, 1920
scene.render.resolution_percentage = 100


def collection(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or scene.collection).children.link(c)
    return c


C_ROOT = collection("DJ_Controller")
C_HOUSING = collection("01_Gehaeuse", C_ROOT)
C_PCB = collection("02_Platine", C_ROOT)
C_JOG = collection("03_Jogwheels", C_ROOT)
C_MIXER = collection("04_Mixer", C_ROOT)
C_PADS = collection("05_Pads_Tasten", C_ROOT)
C_DISPLAY = collection("06_Display", C_ROOT)
C_SCREWS = collection("07_Schrauben", C_ROOT)
C_RIG = collection("RIG_Controls")
C_CAM = collection("Kamera")
C_LIGHT = collection("Licht_Studio")

# ---------------------------------------------------------------- materials


def principled(name, color, metallic=0.0, roughness=0.5, emission=None, strength=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    b.inputs["Coat Weight"].default_value = coat
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


def brushed_aluminium(name):
    """Concentric brushed aluminium, driven by object-space radius (works on any disc)."""
    m = principled(name, (0.80, 0.81, 0.83), metallic=1.0, roughness=0.26)
    nt = m.node_tree
    n, l = nt.nodes, nt.links
    b = n["Principled BSDF"]
    b.inputs["Anisotropic"].default_value = 0.75
    tc = n.new("ShaderNodeTexCoord")
    flat = n.new("ShaderNodeVectorMath"); flat.operation = "MULTIPLY"
    flat.inputs[1].default_value = (1, 1, 0)
    rad = n.new("ShaderNodeVectorMath"); rad.operation = "LENGTH"
    noise = n.new("ShaderNodeTexNoise"); noise.noise_dimensions = "1D"
    noise.inputs["Scale"].default_value = 900.0
    noise.inputs["Detail"].default_value = 3.0
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = 0.3, (0.16, 0.16, 0.16, 1)
    ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = 0.7, (0.34, 0.34, 0.34, 1)
    bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.08
    tan = n.new("ShaderNodeTangent"); tan.direction_type = "RADIAL"; tan.axis = "Z"
    l.new(tc.outputs["Object"], flat.inputs[0])
    l.new(flat.outputs["Vector"], rad.inputs[0])
    l.new(rad.outputs["Value"], noise.inputs["W"])
    l.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    l.new(ramp.outputs["Color"], b.inputs["Roughness"])
    l.new(noise.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], b.inputs["Normal"])
    l.new(tan.outputs["Tangent"], b.inputs["Tangent"])
    return m


M_HOUSING = principled("Gehaeuse_Mattschwarz", (0.018, 0.018, 0.02), roughness=0.62)
M_PLATE = principled("Deckplatte_Mattschwarz", (0.012, 0.012, 0.014), roughness=0.5, coat=0.15)
M_ALU = brushed_aluminium("Alu_Gebuerstet")
M_RING = principled("Jogring_Gummi", (0.03, 0.03, 0.032), roughness=0.8)
M_CAP = principled("Mittelkappe_Schwarz_Glanz", (0.01, 0.01, 0.01), roughness=0.15, coat=1.0)
M_PCB = principled("Platine_Gruen", (0.01, 0.12, 0.05), roughness=0.4)
M_CHIP = principled("Chip_Schwarz", (0.02, 0.02, 0.02), roughness=0.35)
M_GOLD = principled("Kontakte_Gold", (1.0, 0.72, 0.3), metallic=1.0, roughness=0.25)
M_STEEL = principled("Schraube_Stahl", (0.62, 0.63, 0.66), metallic=1.0, roughness=0.3)
M_KNOB = principled("Poti_Gummi", (0.05, 0.05, 0.055), roughness=0.7)
M_FADER = principled("Fader_Kappe", (0.09, 0.09, 0.1), roughness=0.55)
M_SLOT = principled("Schlitz_Schwarz", (0.0, 0.0, 0.0), roughness=0.9)
M_WHITE = principled("Markierung_Weiss", (0.9, 0.9, 0.9), roughness=0.4, emission=(1, 1, 1), strength=1.5)
M_PAD_C = principled("Pad_Cyan", (0.02, 0.05, 0.06), roughness=0.3, emission=(0.0, 0.85, 1.0), strength=6.0)
M_PAD_M = principled("Pad_Magenta", (0.06, 0.02, 0.05), roughness=0.3, emission=(1.0, 0.05, 0.75), strength=6.0)
M_PLAY = principled("Taste_Play", (0.03, 0.03, 0.03), roughness=0.4, emission=(0.2, 1.0, 0.45), strength=4.0)
M_CUE = principled("Taste_Cue", (0.03, 0.03, 0.03), roughness=0.4, emission=(1.0, 0.55, 0.05), strength=4.0)
M_SCREEN = principled("Display_Screen", (0.0, 0.0, 0.0), roughness=0.1, emission=(0.25, 0.6, 1.0), strength=2.5)
M_FLOOR = principled("Studio_Boden", (0.004, 0.004, 0.005), roughness=0.6)

# ---------------------------------------------------------------- geometry helpers


def _finish(name, bm, coll, mat, loc, bevel):
    for face in bm.faces:
        face.smooth = True
    for e in bm.edges:  # sharp edges keep caps crisp while round sides stay smooth
        if e.is_manifold and e.calc_face_angle(0) > math.radians(35):
            e.smooth = False
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    me.materials.append(mat)
    coll.objects.link(ob)
    if bevel:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width, mod.segments, mod.limit_method = bevel, 3, "ANGLE"
        mod.harden_normals = True
    return ob


def box(name, size, loc, coll, mat, bevel=0.0015):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    return _finish(name, bm, coll, mat, loc, bevel)


def cylinder(name, r, h, loc, coll, mat, segs=64, bevel=0.0008, r_top=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs,
                          radius1=r, radius2=r if r_top is None else r_top, depth=h)
    return _finish(name, bm, coll, mat, loc, bevel)


def annulus(name, r_out, r_in, h, loc, coll, mat, segs=96, bevel=0.0008):
    bm = bmesh.new()
    rings = []
    for z, r in ((-h / 2, r_out), (h / 2, r_out), (h / 2, r_in), (-h / 2, r_in)):
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / segs),
                                    r * math.sin(2 * math.pi * i / segs), z)) for i in range(segs)])
    for a in range(4):
        ra, rb = rings[a], rings[(a + 1) % 4]
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(name, bm, coll, mat, loc, bevel)


def child(ob, parent):
    ob.parent = parent  # location given in parent space, identity parent-inverse
    return ob


# ---------------------------------------------------------------- explode rig
CTRL = bpy.data.objects.new("CTRL_Explode", None)
CTRL.empty_display_type, CTRL.empty_display_size = "ARROWS", 0.08
CTRL.location = (0.36, 0.0, 0.0)
C_RIG.objects.link(CTRL)
CTRL["explode_width"] = 0.075
CTRL.id_properties_ui("explode_width").update(min=0.0, soft_max=0.25, subtype="DISTANCE",
                                             description="Abstand zwischen zwei Explosions-Schichten (m)")
CTRL["explode_amount"] = 1.0
CTRL.id_properties_ui("explode_amount").update(min=0.0, max=1.0, description="Globaler Explosions-Multiplikator")
N_LAYERS = 6
for k in range(1, N_LAYERS + 1):
    CTRL[f"layer_{k}"] = 0.0
    CTRL.id_properties_ui(f"layer_{k}").update(min=-0.2, max=1.2, soft_min=0.0, soft_max=1.0,
                                               description=f"Fortschritt Schicht {k} (0 = montiert, 1 = explodiert)")

PARTS = []


def explode(ob, layer, offset=None):
    """Drive delta_location.z = explode_offset * width * amount * layer_k."""
    ob["explode_layer"] = layer
    ob["explode_offset"] = float(layer if offset is None else offset)
    PARTS.append(ob)
    if layer == 0:
        return ob
    d = ob.driver_add("delta_location", 2).driver
    d.type, d.expression = "SCRIPTED", "o * w * a * l"
    for var, target, path in (("o", ob, '["explode_offset"]'), ("w", CTRL, '["explode_width"]'),
                              ("a", CTRL, '["explode_amount"]'), ("l", CTRL, f'["layer_{layer}"]')):
        v = d.variables.new()
        v.name, v.type = var, "SINGLE_PROP"
        v.targets[0].id_type, v.targets[0].id, v.targets[0].data_path = "OBJECT", target, path
    return ob


# ---------------------------------------------------------------- controller
W, D = 0.60, 0.34               # footprint
SHELL_H, PLATE_T = 0.032, 0.004
TOP = SHELL_H + PLATE_T          # top surface of the deck plate
DECK_X, JOG_Y = 0.175, 0.035

explode(box("Gehaeuse_Unterschale", (W, D, SHELL_H), (0, 0, SHELL_H / 2), C_HOUSING, M_HOUSING, bevel=0.006), 0)
for sx in (-1, 1):
    for sy in (-1, 1):
        explode(child(cylinder(f"Gummifuss_{'L' if sx < 0 else 'R'}{'V' if sy < 0 else 'H'}", 0.012, 0.004,
                               (sx * (W / 2 - 0.04), sy * (D / 2 - 0.04), -SHELL_H / 2 - 0.002),
                               C_HOUSING, M_RING), bpy.data.objects["Gehaeuse_Unterschale"]), 0)

# PCB layer (1)
pcb = explode(box("Platine", (W - 0.05, D - 0.05, 0.0025), (0, 0, SHELL_H - 0.006), C_PCB, M_PCB, bevel=0.0005), 1)
chips = [("Chip_DSP", (0.05, 0.05, 0.004), (0.0, 0.05)), ("Chip_Audio", (0.03, 0.03, 0.003), (0.0, -0.04)),
         ("Chip_MCU_L", (0.028, 0.028, 0.003), (-0.17, -0.1)), ("Chip_MCU_R", (0.028, 0.028, 0.003), (0.17, -0.1)),
         ("USB_Buchse", (0.02, 0.012, 0.008), (0.0, D / 2 - 0.035))]
for name, size, (x, y) in chips:
    explode(child(box(name, size, (x, y, size[2] / 2 + 0.00125), C_PCB, M_CHIP, bevel=0.0004), pcb), 1)
for i, x in enumerate((-0.23, 0.23)):
    explode(child(box(f"Steckerleiste_{i + 1}", (0.05, 0.008, 0.005), (x, 0.12, 0.004), C_PCB, M_GOLD,
                      bevel=0.0003), pcb), 1)

# deck plate (2) + slots/printing that belong to it
plate = explode(box("Deckplatte", (W - 0.004, D - 0.004, PLATE_T), (0, 0, SHELL_H + PLATE_T / 2),
                    C_HOUSING, M_PLATE, bevel=0.0015), 2)
for name, size, (x, y) in (("Schlitz_Linefader_CH1", (0.006, 0.075, 0.0006), (-0.035, -0.06)),
                           ("Schlitz_Linefader_CH2", (0.006, 0.075, 0.0006), (0.035, -0.06)),
                           ("Schlitz_Crossfader", (0.075, 0.006, 0.0006), (0.0, -0.135))):
    explode(child(box(name, size, (x, y, PLATE_T / 2), C_MIXER, M_SLOT, bevel=0), plate), 2)

# jogwheels: platter (3), ring (4), centre cap (5)
for side, sx in (("L", -1), ("R", 1)):
    x = sx * DECK_X
    explode(cylinder(f"Jog_{side}_Platter", 0.072, 0.010, (x, JOG_Y, TOP + 0.005), C_JOG, M_ALU, segs=128), 3)
    ring = explode(annulus(f"Jog_{side}_Ring", 0.083, 0.073, 0.014, (x, JOG_Y, TOP + 0.007), C_JOG, M_RING), 4)
    explode(child(box(f"Jog_{side}_Ring_Marker", (0.004, 0.01, 0.0008), (0, 0.078, 0.0072), C_JOG, M_WHITE,
                      bevel=0), ring), 4)
    explode(cylinder(f"Jog_{side}_Mittelkappe", 0.022, 0.008, (x, JOG_Y, TOP + 0.014), C_JOG, M_CAP,
                     segs=64, r_top=0.019), 5)

# mixer section
for ch, x in (("CH1", -0.035), ("CH2", 0.035)):
    for band, y in (("High", 0.125), ("Mid", 0.09), ("Low", 0.055)):
        knob = explode(cylinder(f"EQ_{ch}_{band}", 0.011, 0.016, (x, y, TOP + 0.008), C_MIXER, M_KNOB,
                                segs=48, r_top=0.0095), 5)
        explode(child(box(f"EQ_{ch}_{band}_Markierung", (0.0015, 0.007, 0.0006), (0, 0.005, 0.008),
                          C_MIXER, M_WHITE, bevel=0), knob), 5)
    explode(box(f"Linefader_{ch}_Schiene", (0.004, 0.07, 0.003), (x, -0.06, TOP + 0.0015), C_MIXER, M_STEEL,
                bevel=0.0004), 3)
    cap = explode(box(f"Linefader_{ch}_Kappe", (0.016, 0.01, 0.014), (x, -0.045, TOP + 0.009), C_MIXER, M_FADER,
                      bevel=0.002), 5)
    explode(child(box(f"Linefader_{ch}_Kappe_Linie", (0.014, 0.0012, 0.0006), (0, 0, 0.007), C_MIXER, M_WHITE,
                      bevel=0), cap), 5)
explode(box("Crossfader_Schiene", (0.07, 0.004, 0.003), (0, -0.135, TOP + 0.0015), C_MIXER, M_STEEL,
            bevel=0.0004), 3)
xf = explode(box("Crossfader_Kappe", (0.01, 0.018, 0.014), (0, -0.135, TOP + 0.009), C_MIXER, M_FADER,
                 bevel=0.002), 5)
explode(child(box("Crossfader_Kappe_Linie", (0.0012, 0.016, 0.0006), (0, 0, 0.007), C_MIXER, M_WHITE,
                  bevel=0), xf), 5)

# display (3)
bezel = explode(box("Display_Rahmen", (0.10, 0.03, 0.004), (0, D / 2 - 0.03, TOP + 0.002), C_DISPLAY, M_CAP,
                    bevel=0.001), 3)
explode(child(box("Display", (0.09, 0.022, 0.0008), (0, 0, 0.0022), C_DISPLAY, M_SCREEN, bevel=0), bezel), 3)

# pads (4) + play/cue (4)
PAD, GAP = 0.024, 0.005
for side, sx, mat in (("L", -1, M_PAD_C), ("R", 1, M_PAD_M)):
    cx = sx * (DECK_X - 0.005)
    for i in range(8):
        col, row = i % 4, i // 4
        px = cx + (col - 1.5) * (PAD + GAP)
        py = -0.095 - row * (PAD + GAP)
        explode(box(f"Pad_{side}_{i + 1:02d}", (PAD, PAD, 0.006), (px, py, TOP + 0.003), C_PADS, mat,
                    bevel=0.002), 4)
    bx = sx * (DECK_X + 2.5 * (PAD + GAP) + 0.006)
    explode(cylinder(f"Taste_Cue_{side}", 0.011, 0.006, (bx, -0.095, TOP + 0.003), C_PADS, M_CUE, segs=48), 4)
    explode(cylinder(f"Taste_Play_{side}", 0.011, 0.006, (bx, -0.124, TOP + 0.003), C_PADS, M_PLAY, segs=48), 4)

# screws (6) – rise highest and spin out
for i, (x, y) in enumerate([(-0.28, -0.15), (0.28, -0.15), (-0.28, 0.15), (0.28, 0.15), (0, -0.155), (0, 0.155)]):
    s = explode(cylinder(f"Schraube_{i + 1:02d}", 0.0045, 0.003, (x, y, TOP + 0.0015), C_SCREWS, M_STEEL,
                         segs=32, r_top=0.004), 6)
    explode(child(box(f"Schraube_{i + 1:02d}_Schlitz", (0.006, 0.0012, 0.0008), (0, 0, 0.0014), C_SCREWS,
                      M_SLOT, bevel=0), s), 6)
    d = s.driver_add("delta_rotation_euler", 2).driver
    d.type, d.expression = "SCRIPTED", "l * 4 * pi"
    v = d.variables.new(); v.name = "l"
    v.targets[0].id_type, v.targets[0].id, v.targets[0].data_path = "OBJECT", CTRL, '["layer_6"]'

# children must not stack their parent's explosion on top of their own
for ob in PARTS:
    if ob.parent is not None and ob.animation_data:
        for fc in ob.animation_data.drivers:
            if fc.data_path == "delta_location":
                ob.driver_remove("delta_location", 2)

# ---------------------------------------------------------------- animation helpers


def key(target, path, frame, value, interp="BEZIER", easing="AUTO", index=-1):
    if index >= 0:
        getattr(target, path)[index] = value
    elif path.startswith('["'):
        target[path[2:-2]] = value
    else:
        setattr(target, path, value)
    target.keyframe_insert(path, frame=frame, index=index)
    anim = target.animation_data if hasattr(target, "animation_data") else None
    fcs = anim.action.fcurves if anim and anim.action else []
    for fc in fcs:
        if fc.data_path == path and (index < 0 or fc.array_index == index):
            for kp in fc.keyframe_points:
                if int(round(kp.co.x)) == frame:
                    kp.interpolation, kp.easing = interp, easing


# staggered explosion: top layer leaves first; assembly: bottom layer seats first with a snap
EXPLODE_T0, EXPLODE_STAGGER, EXPLODE_DUR = f(2.0), 18, 66
ASSEMBLE_T0, ASSEMBLE_STAGGER, SNAP_DUR = f(9.0) + 2, 12, 14
SNAP_HITS = {}
for k in range(1, N_LAYERS + 1):
    p = f'["layer_{k}"]'
    t0 = EXPLODE_T0 + (N_LAYERS - k) * EXPLODE_STAGGER
    key(CTRL, p, FRAME_START, 0.0, "CONSTANT")
    key(CTRL, p, t0, 0.0, "BACK", "EASE_OUT")
    key(CTRL, p, t0 + EXPLODE_DUR, 1.0, "SINE", "EASE_IN_OUT")
    a0 = ASSEMBLE_T0 + (k - 1) * ASSEMBLE_STAGGER
    key(CTRL, p, a0 - 6, 1.02, "SINE", "EASE_OUT")      # tiny lift = anticipation
    key(CTRL, p, a0, 1.0, "EXPO", "EASE_IN")             # accelerate into the seat ...
    hit = a0 + SNAP_DUR
    bounce = 0.004 / (k * CTRL["explode_width"])         # ~4 mm rebound regardless of layer height
    key(CTRL, p, hit, 0.0, "SINE", "EASE_OUT")           # ... snap
    key(CTRL, p, hit + 3, bounce, "SINE", "EASE_IN")
    key(CTRL, p, hit + 7, 0.0, "CONSTANT")
    SNAP_HITS[k] = hit

scene.timeline_markers.new("Hook", frame=FRAME_START)
scene.timeline_markers.new("Explosion", frame=EXPLODE_T0)
scene.timeline_markers.new("Zusammenbau", frame=ASSEMBLE_T0)
scene.timeline_markers.new("Endframe_Top", frame=f(13.0))

# pad emission: 120 BPM pulse (15 frames/beat), snap flashes on assembly


def pad_strength(mat):
    return mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]


for mat, phase, peak in ((M_PAD_C, 0, 26.0), (M_PAD_M, 7, 22.0)):
    sock = pad_strength(mat)
    def k_(frame, val, interp="BEZIER", easing="AUTO"):
        sock.default_value = val
        sock.keyframe_insert("default_value", frame=frame)
        for fc in mat.node_tree.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                if int(round(kp.co.x)) == frame:
                    kp.interpolation, kp.easing = interp, easing
    k_(FRAME_START, 3.0)
    for b in range(FRAME_START + phase, EXPLODE_T0 + 180, 15):           # hook + explosion beats
        amp = peak if b < EXPLODE_T0 else peak * 0.45
        k_(b, amp, "EXPO", "EASE_OUT")
        k_(b + 9, 3.0 if b < EXPLODE_T0 else 4.0)
    k_(ASSEMBLE_T0 - 4, 3.0)
    for k, hit in SNAP_HITS.items():                                       # every seat clicks
        k_(hit, 45.0 if k == 4 else 14.0, "EXPO", "EASE_OUT")
        k_(hit + 8, 5.0)
    k_(SNAP_HITS[N_LAYERS] + 8, 5.0)
    for b in range(f(13.0) + phase, FRAME_END, 15):                        # end-frame groove
        k_(b, 16.0, "EXPO", "EASE_OUT")
        k_(b + 9, 6.0)

# ---------------------------------------------------------------- camera (target + orbit rig, all keyframed)
TARGET = bpy.data.objects.new("CAM_Target", None)
TARGET.empty_display_type, TARGET.empty_display_size = "SPHERE", 0.03
RIG = bpy.data.objects.new("CAM_Orbit", None)
RIG.empty_display_type, RIG.empty_display_size = "CIRCLE", 0.4
cam_data = bpy.data.cameras.new("CAM_Reel")
cam_data.lens, cam_data.clip_start, cam_data.clip_end = 50, 0.01, 50
cam_data.dof.use_dof, cam_data.dof.focus_object, cam_data.dof.aperture_fstop = True, TARGET, 5.6
CAM = bpy.data.objects.new("CAM_Reel", cam_data)
for ob in (TARGET, RIG, CAM):
    C_CAM.objects.link(ob)
CAM.parent = RIG
tt = CAM.constraints.new("TRACK_TO")
tt.target, tt.track_axis, tt.up_axis = TARGET, "TRACK_NEGATIVE_Z", "UP_Y"
scene.camera = CAM

END_Y = -0.15  # shifts the controller into the upper frame -> lower third stays free for "DJ Bernd"
camera_keys = [
    # frame,          rig z-rot (deg), cam local (y, z),  target (y, z)
    (FRAME_START,     25,             (-2.4, 0.85),      (0.0, 0.02)),
    (f(2.0),          5,              (-0.95, 0.42),     (-0.01, 0.05)),
    (f(5.5),          -70,            (-1.35, 0.75),     (0.0, 0.22)),
    (f(9.0),          -160,           (-1.35, 0.95),     (0.0, 0.24)),
    (f(11.0),         -275,           (-1.05, 1.35),     (-0.08, 0.08)),
    (f(13.0),         -360,           (-0.012, 1.85),    (END_Y, 0.0)),
    (FRAME_END,       -360,           (-0.012, 1.78),    (END_Y, 0.0)),
]
for frame, rot, (cy, cz), (ty, tz) in camera_keys:
    interp, easing = ("EXPO", "EASE_OUT") if frame == FRAME_START else ("BEZIER", "AUTO")
    key(RIG, "rotation_euler", frame, math.radians(rot), interp, easing, index=2)
    key(RIG, "location", frame, ty, interp, easing, index=1)
    key(CAM, "location", frame, cy, interp, easing, index=1)
    key(CAM, "location", frame, cz, interp, easing, index=2)
    key(TARGET, "location", frame, ty, interp, easing, index=1)
    key(TARGET, "location", frame, tz, interp, easing, index=2)

# ---------------------------------------------------------------- dark studio + rim light
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.002, 0.002, 0.003, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

floor = bpy.data.objects.new("Studio_Boden", bpy.data.meshes.new("Studio_Boden"))
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6.0); bm.to_mesh(floor.data); bm.free()
floor.data.materials.append(M_FLOOR)
floor.location.z = -SHELL_H / 2 - 0.004 + SHELL_H / 2 - 0.0001  # just below the rubber feet
C_LIGHT.objects.link(floor)

LIGHT_AIM = bpy.data.objects.new("LIGHT_Aim", None)
LIGHT_AIM.location = (0, 0, 0.08)
C_LIGHT.objects.link(LIGHT_AIM)


def area(name, loc, energy, color, size, size_y=None):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy, ld.color = energy, color
    ld.shape, ld.size, ld.size_y = ("RECTANGLE", size, size_y) if size_y else ("SQUARE", size, size)
    ob = bpy.data.objects.new(name, ld)
    ob.location = loc
    c = ob.constraints.new("TRACK_TO")
    c.target, c.track_axis, c.up_axis = LIGHT_AIM, "TRACK_NEGATIVE_Z", "UP_Y"
    ob.visible_camera = False  # no light cards in frame
    C_LIGHT.objects.link(ob)
    return ob


area("Licht_Key_Softbox", (-0.7, -0.9, 1.3), 18, (1.0, 0.96, 0.92), 1.2)
area("Licht_Rim_Cyan", (-1.0, 1.0, 0.45), 110, (0.35, 0.85, 1.0), 0.25, 1.2)
area("Licht_Rim_Magenta", (1.0, 1.0, 0.45), 110, (1.0, 0.3, 0.85), 0.25, 1.2)
area("Licht_Top_Fill", (0.0, -0.1, 2.2), 7, (0.9, 0.93, 1.0), 2.0)
area("Licht_Kante_Front", (0.0, -1.4, 0.18), 8, (0.85, 0.9, 1.0), 2.0, 0.08)

# ---------------------------------------------------------------- render settings (EEVEE)
scene.render.engine = "BLENDER_EEVEE_NEXT" if bpy.app.version < (5, 0, 0) else "BLENDER_EEVEE"
eevee = scene.eevee
eevee.taa_render_samples = 64
eevee.use_shadows = True
try:
    eevee.use_raytracing = True
    eevee.ray_tracing_method = "SCREEN"
except AttributeError:
    pass
vs = scene.view_settings
vs.view_transform = "AgX"
for look in ("AgX - Medium High Contrast", "AgX - Punchy", "Medium High Contrast"):
    try:
        vs.look = look
        break
    except TypeError:
        continue

# bloom for the pad glow (compositor glare)
scene.use_nodes = True
nt = scene.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
rl, comp = nt.nodes.new("CompositorNodeRLayers"), nt.nodes.new("CompositorNodeComposite")
glare = nt.nodes.new("CompositorNodeGlare")
glare.glare_type = "BLOOM" if "BLOOM" in [i.identifier for i in glare.bl_rna.properties["glare_type"].enum_items] else "FOG_GLOW"
for attr, val in (("threshold", 2.0), ("size", 6), ("mix", -0.7)):
    if hasattr(glare, attr):
        setattr(glare, attr, val)
for sock, val in (("Threshold", 2.0), ("Strength", 0.3), ("Size", 0.5)):
    if sock in glare.inputs:
        glare.inputs[sock].default_value = val
nt.links.new(rl.outputs["Image"], glare.inputs["Image"])
nt.links.new(glare.outputs["Image"], comp.inputs["Image"])
rl.location, glare.location, comp.location = (-300, 0), (0, 0), (300, 0)

scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format = "MPEG4"
scene.render.ffmpeg.codec = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.ffmpeg.ffmpeg_preset = "GOOD"
scene.render.filepath = "//dj_bernd_exploded_preview.mp4"
scene.frame_set(FRAME_START)

result = {
    "parts": len(PARTS),
    "collections": [c.name for c in C_ROOT.children],
    "snap_hits": SNAP_HITS,
    "glare": glare.glare_type,
}
