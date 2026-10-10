import subprocess, json, os, sys

S = "/tmp/claude-0/-home-user-claude/12c49631-ca9c-5648-9da1-0be9e9648064/scratchpad/r2"
OUT = sys.argv[1]
BLACK = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
_tl = json.load(open(f"{S}/timeline.json")); TOTAL = _tl["hook"]["total"] + _tl["main"]["total"]
os.makedirs(f"{S}/txt", exist_ok=True)

# (start, end, text, kind)   kind: hook | sub | step | cta | cta_sub
CARDS = [
    (0.00, 1.33, "DIESE PIZZA",                  "h1"),
    (0.00, 1.33, "STEHT AUF KEINER",             "h2"),
    (0.00, 1.33, "NORMALEN KARTE",               "h3"),
    (0.10, 1.33, "nur für die, die fragen",      "hsub"),
    (1.45, 4.04, "Teig. Von Hand. Jeden Tag.",   "step_s"),
    (4.04, 5.21, "Tomatensauce",                 "step"),
    (5.21, 7.96, "Mozzarella",                   "step"),
    (7.96, 10.17, "+ Ofenkürbis",                "step"),
    (10.17, 11.58, "ab in den Ofen",             "step"),
    (11.58, 14.21, "+ Prosciutto & Parmesan",    "step"),
    (14.21, TOTAL, "NUR AUF DER",                "c1"),
    (14.21, TOTAL, "EXTRAKARTE",                 "c2"),
    (14.41, TOTAL, "frag beim Bestellen danach", "csub"),
]

_BIG = "borderw=9:bordercolor=black@0.85:shadowx=0:shadowy=6:shadowcolor=black@0.5"
STYLE = {
    # font, size, color, y, extra
    "h1":     (BLACK, 120, "white",   600, _BIG),
    "h2":     (BLACK,  80, "white",   745, _BIG),
    "h3":     (BLACK,  80, "#FFB23F", 840, _BIG),
    "hsub":   (BOLD,   50, "white",   950, "borderw=5:bordercolor=black@0.8"),
    "step":   (BOLD,   60, "white",  1330, "box=1:boxcolor=black@0.55:boxborderw=26"),
    "step_s": (BOLD,   54, "white",  1330, "box=1:boxcolor=black@0.55:boxborderw=26"),
    "c1":     (BLACK, 110, "white",   640, _BIG),
    "c2":     (BLACK, 104, "#FFB23F", 770, _BIG),
    "csub":   (BOLD,   52, "white",   900, "borderw=5:bordercolor=black@0.8"),
}

X = 70  # left-aligned, keeps the right 230 px (IG buttons) clear
filters = []
for i, (a, b, text, kind) in enumerate(CARDS):
    font, size, color, y, extra = STYLE[kind]
    tf = f"{S}/txt/{i}.txt"; open(tf, "w").write(text)
    fi, fo = 0.12, 0.10
    alpha = f"if(lt(t,{a}+{fi}),(t-{a})/{fi},if(gt(t,{b}-{fo}),({b}-t)/{fo},1))"
    if b >= TOTAL - 0.01:
        alpha = f"min(1,(t-{a})/{fi})"
    # small slide-up on entry (12 px)
    yexpr = f"{y}+12*max(0,1-(t-{a})/{fi})"
    filters.append(
        f"drawtext=fontfile={font}:textfile={tf}:fontsize={size}:fontcolor={color}:"
        f"x={X}:y='{yexpr}':alpha='{alpha}':enable='between(t,{a},{b})':{extra}")
chain = ",".join(filters)
open(f"{S}/overlay_chain.txt", "w").write(chain)

if OUT == "alpha":
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                    f"color=c=black@0.0:s=1080x1920:r=24:d={TOTAL},format=rgba",
                    "-vf", chain, "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le",
                    "-alpha_bits", "16", f"{S}/overlay3_alpha.mov"], check=True)
else:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{S}/clean.mp4", "-vf", chain,
                    "-c:v", "libx264", "-crf", "17", "-preset", "slow", "-pix_fmt", "yuv420p",
                    "-c:a", "copy", "-movflags", "+faststart", f"{S}/preview3.mp4"], check=True)
