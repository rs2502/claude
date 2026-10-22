# Video edits

## Edit tools (setup by Kapa, @kappa.ai)

This runs in a Claude Code cloud container (Ubuntu, CPU only). Everything outside
this repo (Python env, models, Blender) disappears with the container: if a path
below is missing, reinstall it from the steps in this file.

- Tools folder: `~/.local/edit-tools`
- PY (Whisper, CLAP, Demucs): `~/.local/edit-tools/.venv/bin/python` (Python 3.11,
  torch 2.2.2, `numpy<2`, transformers 4.44.2, demucs 4.0.1, openai-whisper)
- Blender: `/usr/bin/blender` (4.0.2 from Ubuntu apt: `apt-get install -y blender`)
- HyperFrames: `npx hyperframes@latest ...`; skills live in `~/.claude/skills/hyperframes*`
  (`npx hyperframes@latest skills update`, `npx hyperframes@latest browser ensure`)

Reinstall the Python env (download.pytorch.org is blocked here, so torch comes from PyPI):
```bash
uv venv --python 3.11 ~/.local/edit-tools/.venv
uv pip install --python ~/.local/edit-tools/.venv/bin/python torch==2.2.2 torchaudio==2.2.2 "numpy<2" transformers==4.44.2 soundfile demucs==4.0.1
uv pip install --python ~/.local/edit-tools/.venv/bin/python --only-binary llvmlite --only-binary numba openai-whisper
```

### Network limits of this container

The network policy blocks the model hosts: `openaipublic.azureedge.net` (Whisper),
`huggingface.co` (CLAP), `dl.fbaipublicfiles.com` (Demucs), plus `download.pytorch.org`,
`download.blender.org` and `cdn.jsdelivr.net`. Until those are allowed in the
environment's network settings, the models can't download.
HyperFrames compositions must load GSAP locally (`gsap.min.js` next to `index.html`,
taken from npm: `npm pack gsap@3.14.2`), not from jsDelivr, or the render fails.

### How to run

Always prefix Python runs with `TOKENIZERS_PARALLELISM=false PYTHONUTF8=1`.

- Words with timestamps (Whisper):
  `PY scripts/transcribe.py voice.mp3 --model small --language en --prompt "Claude Code, HyperFrames"`
  writes `transcript.json`; in a HyperFrames project: `npx hyperframes transcribe transcript.json`.
  Models: tiny, base, small (default), medium, large-v3.
- Sounds (CLAP), `scripts/listen.py`:
  - `events <video or audio> [--out events.json] [--sensitivity 1.6]` (busy references: 2.2)
  - `label <file or folder>` names whole files (sort an SFX library)
  - `match <piece.wav> <effects folder> [--top 5]`; cut a piece with
    `ffmpeg -ss 3.2 -to 3.6 -i ref.mp4 -vn -ac 1 piece.wav`
- Stems (Demucs):
  `ffmpeg -i clip.mp4 -vn -ac 2 -ar 44100 clip.wav` then
  `PY -m demucs -n htdemucs -o stems clip.wav` gives `stems/htdemucs/clip/{vocals,drums,bass,other}.wav`.
  Use Latin file names.
- Blender scripts: `blender -b -P blender/run.py -- blender/donut.py renders/donut.png`.
  `run.py` turns off Cycles denoising, because the apt build has no OpenImageDenoise
  (with an official Blender build: `blender -b -P blender/donut.py -- renders/donut.png`).
  `donut.py` is the pattern for new objects: meshes, materials, light, camera, render.
- New HyperFrames project: `npx hyperframes@latest init <name> --example=blank --non-interactive`,
  render with `npx hyperframes render`.

### Limits

- CLAP names clean effects well (click, pop, whoosh, tick, ding, typing).
- Under a voice, `events` also catches syllables and names them oddly. Under loud music
  the events follow the beat and the names become noise: split with Demucs first, then
  run `events` on `drums.wav` and `other.wav`.
- Words are Whisper's job. CLAP is for everything that is not speech.

### Rules

- Never answer "I can't hear audio". Use Whisper for words and CLAP for sounds and say how sure you are.
- Subtitles come from Whisper word timings, never from guesses. Karaoke: show a short phrase,
  light each word up at its own start time.
- Try Blender before paid 3D or image generation. Render assets at 2x.
