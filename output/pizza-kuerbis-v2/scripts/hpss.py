"""Harmonic/percussive split (median-filter HPSS) of the original reel audio.
Tonal, sustained content (music) -> harmonic; short hits, crackle, foley -> percussive."""
import sys, wave
import numpy as np
from numpy.lib.stride_tricks import sliding_window_view as swv

src, out_p, out_h = sys.argv[1:4]
w = wave.open(src); sr = w.getframerate(); ch = w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, ch).astype(np.float32) / 32768

n, hop = 2048, 512
win = np.hanning(n).astype(np.float32)

def stft(y):
    y = np.pad(y, (n // 2, n // 2 + n))
    fr = swv(y, n)[::hop] * win
    return np.fft.rfft(fr, axis=1).T            # freq x time

def istft(S, L):
    fr = np.fft.irfft(S.T, n, axis=1) * win
    y = np.zeros(hop * (fr.shape[0] - 1) + n, np.float32); norm = np.zeros_like(y)
    for i, f in enumerate(fr):
        y[i * hop:i * hop + n] += f; norm[i * hop:i * hop + n] += win ** 2
    y /= np.maximum(norm, 1e-6)
    return y[n // 2:n // 2 + L]

def medfilt(M, k, axis):
    pad = [(0, 0), (0, 0)]; pad[axis] = (k // 2, k // 2)
    Mp = np.pad(M, pad, mode="edge")
    return np.median(swv(Mp, k, axis=axis), axis=-1)

P_out, H_out = [], []
for c in range(ch):
    S = stft(x[:, c]); M = np.abs(S)
    H = medfilt(M, 31, axis=1)      # smooth over time  -> sustained tones
    P = medfilt(M, 31, axis=0)      # smooth over freq  -> broadband hits
    mp = P ** 2 / (P ** 2 + H ** 2 + 1e-12)     # soft (Wiener) masks
    P_out.append(istft(S * mp, len(x))); H_out.append(istft(S * (1 - mp), len(x)))

for path, y in ((out_p, P_out), (out_h, H_out)):
    y = np.stack(y, 1); y = np.clip(y, -1, 1)
    with wave.open(path, "wb") as o:
        o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr)
        o.writeframes((y * 32767).astype(np.int16).tobytes())
for name, y in (("percussive", np.stack(P_out, 1)), ("harmonic", np.stack(H_out, 1))):
    print(name, round(20 * np.log10(np.sqrt((y ** 2).mean()) + 1e-9), 1), "dB rms")
