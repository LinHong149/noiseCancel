import numpy as np
import sounddevice as sd

# ================= USER SETTINGS =================
SR = 48000
BLOCKSIZE = 1024
AGG_DEVICE = 5       # Aggregate Device
REF_CH = 0           # iPhone
OUT_CH = 0           # Bedroom speaker
OUTPUT_GAIN = 1.0    # Adjust this to control output volume
# ==================================================

print("Audio devices:")
print(sd.query_devices())

def main():
    print("[INFO] Starting simple audio inversion (180° phase shift)")
    print("[INFO] Press Ctrl+C to stop")

    def input_callback(indata, frames, time_info, status):
        if status:
            print(status)

        # Get reference signal from iPhone
        x_ref = indata[:, 0].astype(np.float32)
        
        # Simple 180° phase inversion (multiply by -1)
        y_out = -x_ref * OUTPUT_GAIN
        
        # Store for output callback
        global last_block
        last_block = y_out

        # Monitoring every ~50 blocks
        if not hasattr(input_callback, 'counter'):
            input_callback.counter = 0
        input_callback.counter += 1
        if input_callback.counter % 50 == 0:
            print(f"[AUDIO] Ref RMS: {np.sqrt(np.mean(x_ref**2)):.4f} | "
                  f"Out RMS: {np.sqrt(np.mean(y_out**2)):.4f}")

    def output_callback(outdata, frames, time_info, status):
        if status:
            print(status)

        global last_block
        if last_block is not None:
            # Output inverted signal to both channels
            outdata[:, 0] = last_block
            outdata[:, 1] = last_block
        else:
            outdata.fill(0)

    # Global variable for audio processing
    global last_block
    last_block = None

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
        try:
            sd.sleep(10**9)  # Run until Ctrl+C
        except KeyboardInterrupt:
            print("\nStopped.")

if __name__ == "__main__":
    main()
