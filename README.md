# Noise Cancellation System

A real-time Active Noise Cancellation (ANC) system implemented in Python with a Next.js frontend interface.

## Project Overview

This project implements a sophisticated real-time noise cancellation system that uses adaptive filtering algorithms to actively cancel unwanted noise. The system consists of a Python backend that handles the audio processing and a Next.js frontend for user interface.

## System Architecture

### Backend (Python)
- **Real-time audio processing** using `sounddevice` and `scipy`
- **Adaptive filtering algorithms** for noise cancellation
- **Secondary path identification** for system modeling
- **Block-based processing** for low-latency performance

### Frontend (Next.js)
- **Modern React-based interface** with TypeScript
- **Tailwind CSS** for styling
- **Responsive design** for various screen sizes

## Backend Implementation

### Core Components

#### 1. Audio Configuration
```python
SR = 48000              # Sample rate: 48kHz
BLOCKSIZE = 1024        # Processing block size
AGG_DEVICE = 5          # Aggregate Device for routing
REF_CH = 0              # Reference channel (iPhone)
ERR_CH = 1              # Error channel (Built-in microphone)
OUT_CH = 0              # Output channel (Bedroom speaker)
```

#### 2. FIR Filter Class
A custom FIR (Finite Impulse Response) filter implementation for blockwise convolution:
- Maintains filter state between blocks
- Uses `scipy.signal.lfilter` for efficient processing
- Handles filter taps and delay state

#### 3. Secondary Path Identification
The system first identifies the secondary path (speaker-to-microphone transfer function):
- **Excitation signal**: Random noise at low amplitude (0.05 gain)
- **NLMS algorithm**: Normalized Least Mean Squares for adaptation
- **Duration**: 2 seconds of identification
- **Purpose**: Models the acoustic path from speaker to error microphone

#### 4. ANC (Active Noise Cancellation) Class
The main noise cancellation engine:
- **Adaptive filter**: 256-tap FIR filter (W)
- **Reference buffer**: Stores recent reference signal samples
- **Secondary path buffer**: Stores samples for secondary path modeling
- **Leaky LMS algorithm**: Prevents filter divergence
- **Output limiting**: Clips output to prevent audio distortion

### Algorithm Details

#### Secondary Path Identification Process
1. Generate random excitation signal
2. Play through output speaker while recording reference and error signals
3. Use NLMS to estimate the secondary path transfer function
4. Store the identified path for use in main ANC algorithm

#### Main ANC Algorithm
For each audio block:
1. **Update reference buffer** with new input samples
2. **Generate anti-noise signal** using adaptive filter W
3. **Model secondary path** using identified transfer function
4. **Update filter coefficients** using leaky LMS:
   ```
   W = (1 - LEAK) * W + MU * e * (xhat / norm) * xbuf
   ```
5. **Limit output** to prevent clipping and distortion

### Key Parameters
- **MU (μ)**: Learning rate (0.0005) - controls adaptation speed
- **LEAK**: Leakage factor (1e-5) - prevents filter divergence
- **OUT_LIMIT**: Output limiting (0.3) - prevents audio distortion
- **Filter lengths**: 256 taps for both W and secondary path

## Challenges and Solutions

### 1. Real-time Processing Constraints
**Challenge**: Maintaining low latency while processing complex adaptive algorithms
**Solution**: 
- Block-based processing with 1024 samples per block
- Efficient buffer management using `np.roll()`
- Optimized NumPy operations for vectorized processing

### 2. Audio Device Routing
**Challenge**: Complex audio routing through aggregate devices
**Solution**:
- Pre-configured aggregate device setup
- Clear channel mapping for reference, error, and output signals
- Device query functionality for troubleshooting

### 3. Filter Stability
**Challenge**: Preventing adaptive filter divergence
**Solution**:
- Leaky LMS algorithm with small leakage factor
- Output limiting to prevent feedback
- Normalized updates to prevent instability

### 4. Secondary Path Modeling
**Challenge**: Accurately modeling the acoustic path from speaker to microphone
**Solution**:
- Dedicated identification phase with controlled excitation
- NLMS algorithm for robust identification
- Sufficient identification duration (2 seconds)

### 5. Audio Quality
**Challenge**: Maintaining audio quality while applying noise cancellation
**Solution**:
- Careful gain staging throughout the system
- Output limiting to prevent clipping
- High sample rate (48kHz) for better audio quality

## Technical Implementation Details

### Audio Processing Pipeline
1. **Input**: 2-channel audio (reference + error)
2. **Processing**: Real-time adaptive filtering
3. **Output**: Anti-noise signal to speakers
4. **Monitoring**: RMS level monitoring every 50 blocks

### Memory Management
- **Circular buffers**: Efficient memory usage for filter states
- **Float32 precision**: Balance between accuracy and performance
- **Block processing**: Reduces memory allocation overhead

### Error Handling
- **Status monitoring**: Audio device status checking
- **Graceful shutdown**: Keyboard interrupt handling
- **Buffer management**: Prevents buffer underruns/overruns

## Dependencies

### Backend Requirements
```
numpy          # Numerical computations
sounddevice    # Real-time audio I/O
scipy          # Signal processing algorithms
```

### Frontend Dependencies
```
react          # UI framework
next           # React framework
typescript     # Type safety
tailwindcss    # Styling
```

## Usage

### Backend Setup
1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r required.txt
   ```

2. Configure audio devices in `main.py`
3. Run the ANC system:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

## Performance Characteristics

- **Latency**: ~21ms (1024 samples at 48kHz)
- **CPU Usage**: Optimized for real-time processing
- **Memory**: Efficient buffer management
- **Audio Quality**: 48kHz sample rate, 32-bit float precision

## Future Enhancements

1. **Web Interface**: Connect frontend to backend for real-time control
2. **Parameter Tuning**: GUI for adjusting algorithm parameters
3. **Multiple Noise Types**: Specialized algorithms for different noise sources
4. **Performance Monitoring**: Real-time performance metrics
5. **Preset Management**: Save/load different configuration presets

## Technical Notes

The system implements a feedforward ANC architecture where:
- **Reference signal**: Captures the noise source (iPhone)
- **Error signal**: Measures residual noise (built-in microphone)
- **Anti-noise**: Generated signal to cancel the noise
- **Adaptive algorithm**: Continuously adjusts to changing conditions

This implementation demonstrates advanced signal processing techniques applied to real-world audio applications, showcasing the complexity and precision required for effective noise cancellation systems.
