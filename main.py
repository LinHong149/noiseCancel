import numpy as np
import sounddevice as sd
from scipy.signal import lfilter

# ================= USER SETTINGS =================

SR = 48000

AGG_DEVICE = 5  # "Noise Canceling Aggregate Device" from your list
REF_CH = 1      # BlackHole Left (phone)
ERR_CH = 3      # Built-in microphone (error mic) - actually channel 2 in 0-based indexing   

BLOCK = 1024         # frames per block (latency ~ BLOCK/SR)
IN_DEVICE = None     # set to device index from sd.query_devices() or keep None
OUT_DEVICE = None    # same for output
SEC_ID_SECS = 2.0    # seconds of test noise for secondary path ID
S_LEN = 256          # FIR length for secondary path estimate s_hat[n]
W_LEN = 256          # FIR length for control filter W[n]
MU = 0.0005          # FxLMS step size (start small; increase if under-cancelling)
LEAK = 1e-5          # weight decay to keep W bounded
OUT_LIMIT = 0.3      # safety limiter for speaker output (float in [-1,1])
TEST_NOISE_GAIN = 0.05 # level for secondary path ID noise
# ==================================================

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

# --- Secondary Path Identification (play noise, record error mic) ---
def identify_secondary_path():
    
    n_frames = int(SEC_ID_SECS * SR)
    # Excite the loudspeaker with white noise (small amplitude)
    excite = (np.random.randn(n_frames).astype(np.float32)) * TEST_NOISE_GAIN

    # Capture error mic while playing noise
    # excite is 1-channel (n,1); route it to speaker Left (out ch 1)
    rec = sd.playrec(
        excite.reshape(-1, 1),
        samplerate=SR,
        channels=2,                    # we want to record 2 input channels total
        dtype='float32',
        input_mapping=[REF_CH, ERR_CH],# 1-based: [1, 3]
        output_mapping=[1],            # 1-based: send mono to output ch 1 (speaker L)
        device=AGG_DEVICE,             # use the single aggregate for in+out
        blocking=True
    )

    err = rec[:,1].astype(np.float32)

    # Estimate s_hat with simple NLMS on the recorded pair (excite -> err)
    s = np.zeros(S_LEN, dtype=np.float32)
    xbuf = np.zeros(S_LEN, dtype=np.float32)
    eps = 1e-6
    mu_id = 0.5  # aggressive for quick ID

    for n in range(n_frames):
        xbuf = np.roll(xbuf, 1); xbuf[0] = excite[n]
        y = np.dot(s, xbuf)
        e = err[n] - y
        # NLMS norm
        norm = np.dot(xbuf, xbuf) + eps
        s += (mu_id / norm) * e * xbuf

    print("[ID] Secondary path identified ({} taps).".format(S_LEN))
    return s

# --- ANC State ---
class ANC:
    def __init__(self, s_hat):
        self.W = np.zeros(W_LEN, dtype=np.float32)   # control filter
        self.xbuf = np.zeros(W_LEN, dtype=np.float32)
        self.sbuf = np.zeros(len(s_hat), dtype=np.float32)
        self.s_hat = s_hat.astype(np.float32)
        self.eps = 1e-6

    def step_block(self, x_ref, e_err):
        """
        x_ref: reference mic block (1D float32)
        e_err: error mic block (1D float32)  [used only for monitoring; FxLMS uses filtered-x]
        returns: y_loud (anti-noise) block
        """
        N = len(x_ref)
        y_out = np.zeros(N, dtype=np.float32)

        for n in range(N):
            # update input buffers
            self.xbuf = np.roll(self.xbuf, 1); self.xbuf[0] = x_ref[n]

            # control output y[n] = W^T x
            y = np.dot(self.W, self.xbuf)
            y_out[n] = y

            # build "filtered-x": xhat = x convolved with s_hat at current sample
            # efficient incremental update via sbuf as if feeding y through s_hat
            # but for FxLMS we need x filtered by s_hat:
            self.sbuf = np.roll(self.sbuf, 1); self.sbuf[0] = x_ref[n]
            xhat = np.dot(self.s_hat, self.sbuf)

            # measure current error (mic hears disturbance + speaker via true S)
            # we don't know true disturbance here in code; use actual mic error sample
            # For adaptation, use FxLMS gradient with xhat
            # e[n] = actual error mic sample after output is applied (from callback)
            # -> we approximate using last provided e_err stream aligned per sample
            e = e_err[n]

            # LMS update
            norm = (np.dot(self.xbuf, self.xbuf) + self.eps)
            self.W = (1 - LEAK) * self.W + MU * e * (xhat / (np.sqrt(norm) + 1e-6)) * self.xbuf

        # safety limiter
        y_out = np.clip(y_out, -OUT_LIMIT, OUT_LIMIT)
        return y_out

def main():
    print("[Step 1] Identifying secondary path...")
    s_hat = identify_secondary_path()
    anc = ANC(s_hat)

    print("[Step 2] Starting ANC stream. Ctrl+C to stop.")
    
    # Double-buffered stream: read 3 input ch (1..3), write 2 output ch (speakers L&R)
    in_channels = 3   # ch1=BH L, ch2=BH R, ch3=Built-in mic
    out_channels = 2  # we drive both speaker channels
    
    print(f"[CONFIG] Using device {AGG_DEVICE} with {in_channels} input channels, {out_channels} output channels")
    print(f"[CONFIG] Reference: Channel 0 (BlackHole Left/Phone)")
    print(f"[CONFIG] Error: Channel 2 (Built-in Microphone)")
    print(f"[CONFIG] Output: Channels 0&1 (Mac Speakers)")
    print("[AUDIO] Monitoring audio levels (every ~1 second):")
    print("[AUDIO] Ref (phone) | Err (mic) | Output")
    print("[AUDIO] " + "-" * 40)

    def callback(indata, outdata, frames, time_info, status):
        if status:
            print(status)
        # 0-based indexing inside the numpy buffers:
        #   agg in ch1 -> indata[:, 0]  (BlackHole L = phone/ref)
        #   agg in ch3 -> indata[:, 2]  (Built-in mic = error)
        x_ref = indata[:, 0].astype(np.float32).copy()  # phone (reference)
        e_err = indata[:, 2].astype(np.float32).copy()  # built-in mic (error)

        # Monitor audio levels
        ref_rms = np.sqrt(np.mean(x_ref**2))
        err_rms = np.sqrt(np.mean(e_err**2))
        
        y = anc.step_block(x_ref, e_err)
        
        # Print audio levels every 50 callbacks (about every second)
        if not hasattr(callback, 'counter'):
            callback.counter = 0
        callback.counter += 1
        
        if callback.counter % 50 == 0:
            out_rms = np.sqrt(np.mean(y**2))
            print(f"[AUDIO] Ref (phone): {ref_rms:.4f} | Err (mic): {err_rms:.4f} | Output: {out_rms:.4f}")

            
        outdata[:, 0] = y  # send to aggregate output ch1 (Mac speakers L)
        outdata[:, 1] = y  # send to aggregate output ch2 (Mac speakers R)

    with sd.Stream(
        samplerate=SR,
        blocksize=BLOCK,
        dtype='float32',
        device=AGG_DEVICE,          # single aggregate device
        channels=(in_channels, out_channels),  # <-- tuple, not input_/output_channels
        callback=callback
    ):
        try:
            sd.sleep(10**9)
        except KeyboardInterrupt:
            print("\nStopped.")

if __name__ == "__main__":
    main()