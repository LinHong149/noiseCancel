import numpy as np
import sounddevice as sd
from scipy.signal import lfilter

# ================= USER SETTINGS =================
SR = 48000
BLOCKSIZE = 1024
AGG_DEVICE = 5       # Aggregate Device
REF_CH = 0           # iPhone
ERR_CH = 1           # Built-in microphone
OUT_CH = 0           # Bedroom speaker
BLOCK = 1024
SEC_ID_SECS = 2.0
S_LEN = 256
W_LEN = 256
MU = 0.0005
LEAK = 1e-5
OUT_LIMIT = 1.0
TEST_NOISE_GAIN = 0.05
INPUT_GAIN = 2.0
OUTPUT_GAIN = 10.0
# ==================================================

# Global variable for audio processing
last_block = None

print("Audio devices:")
print(sd.query_devices())

# --- Helper: blockwise convolution using FIR state ---
class FIR:
    def __init__(self, taps):
        self.b = np.zeros(taps, dtype=np.float32)
        self.zi = np.zeros(taps-1, dtype=np.float32)
    def process(self, x):
        y, self.zi = lfilter(self.b, [1.0], x, zi=self.zi)
        return y

# --- Secondary Path Identification ---
def identify_secondary_path():
    n_frames = int(SEC_ID_SECS * SR)
    excite = (np.random.randn(n_frames).astype(np.float32)) * TEST_NOISE_GAIN

    # Capture reference + error mic together
    rec = sd.playrec(
        excite.reshape(-1,1),          # 1 output channel
        samplerate=SR,
        channels=2,                    # record 2 input channels
        output_mapping=[OUT_CH+1],       # Bedroom speaker
        input_mapping=[REF_CH+1, ERR_CH+1],# [phone, built-in mic]
        device=AGG_DEVICE,
        blocking=True
    )

    x_ref = rec[:, 0].astype(np.float32)  # phone
    err   = rec[:, 1].astype(np.float32)  # built-in mic

    # Estimate secondary path s_hat using NLMS
    s = np.zeros(S_LEN, dtype=np.float32)
    xbuf = np.zeros(S_LEN, dtype=np.float32)
    eps = 1e-6
    mu_id = 0.5

    for n in range(n_frames):
        xbuf = np.roll(xbuf, 1)
        xbuf[0] = excite[n]
        y = np.dot(s, xbuf)
        e = err[n] - y
        norm = np.dot(xbuf, xbuf) + eps
        s += (mu_id / norm) * e * xbuf

    print("[ID] Secondary path identified ({} taps).".format(S_LEN))
    return s

# --- ANC Class ---
class ANC:
    def __init__(self, s_hat):
        self.W = np.zeros(W_LEN, dtype=np.float32)
        self.xbuf = np.zeros(W_LEN, dtype=np.float32)
        self.sbuf = np.zeros(len(s_hat), dtype=np.float32)
        self.s_hat = s_hat.astype(np.float32)
        self.eps = 1e-6

    def step_block(self, x_ref, e_err):
        N = len(x_ref)
        y_out = np.zeros(N, dtype=np.float32)
        for n in range(N):
            self.xbuf = np.roll(self.xbuf, 1)
            self.xbuf[0] = x_ref[n]

            y = np.dot(self.W, self.xbuf)
            y_out[n] = y

            self.sbuf = np.roll(self.sbuf, 1)
            self.sbuf[0] = x_ref[n]
            xhat = np.dot(self.s_hat, self.sbuf)

            e = e_err[n]
            norm = np.dot(self.xbuf, self.xbuf) + self.eps
            self.W = (1 - LEAK) * self.W + MU * e * (xhat / (np.sqrt(norm) + 1e-6)) * self.xbuf

        y_out = np.clip(y_out, -OUT_LIMIT, OUT_LIMIT)
        return y_out

def main():
    print("[Step 1] Identifying secondary path...")
    s_hat = identify_secondary_path()
    anc = ANC(s_hat)

    print("[Step 2] Starting ANC stream. Ctrl+C to stop.")

    # Aggregate Device setup:
    # Input channels: 0=BlackHole L (phone), 1=BlackHole R, 2=Built-in mic
    # Output channels: 0=Bedroom speaker L, 1=Bedroom speaker R

    def input_callback(indata, frames, time_info, status):
        global last_block
        if status:
            print(status)

        x_ref = indata[:, 0].astype(np.float32) * INPUT_GAIN  # phone
        e_err = indata[:, 1].astype(np.float32) * INPUT_GAIN  # built-in mic
        y = anc.step_block(x_ref, e_err)
        last_block = y  # save for output

        # monitoring every ~50 blocks
        if not hasattr(input_callback, 'counter'):
            input_callback.counter = 0
        input_callback.counter += 1
        if input_callback.counter % 50 == 0:
            print(f"[AUDIO] Ref RMS: {np.sqrt(np.mean(x_ref**2)):.4f} | "
                f"Err RMS: {np.sqrt(np.mean(e_err**2)):.4f} | "
                f"Out RMS: {np.sqrt(np.mean(y**2)):.4f}")

    def output_callback(outdata, frames, time_info, status):
        global last_block
        if status:
            print(status)

        if last_block is not None:
            outdata[:, 0] = last_block * OUTPUT_GAIN
            outdata[:, 1] = last_block * OUTPUT_GAIN
        else:
            outdata.fill(0)

    # --- Open stream ---
    with sd.InputStream(
        device=AGG_DEVICE,
        channels=2,
        samplerate=SR,
        blocksize=BLOCKSIZE,
        dtype='float32',
        callback=input_callback
    ), sd.OutputStream(
        device=AGG_DEVICE,
        channels=2,
        samplerate=SR,
        blocksize=BLOCKSIZE,
        dtype='float32',
        callback=output_callback
    ):
        sd.sleep(int(1e9))  # or run until Ctrl+C

        try:
            sd.sleep(10**9)
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()