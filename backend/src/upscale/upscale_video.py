import os
import sys
import subprocess
import numpy as np
import onnxruntime as ort
import time
import threading
from pathlib import Path

# ============================================
# FIX CUDA/cuDNN PATH 
# ============================================
cuda_bin_path = r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.6\bin"
os.environ["PATH"] = cuda_bin_path + os.pathsep + os.environ["PATH"]

if sys.platform == 'win32':
    os.add_dll_directory(cuda_bin_path)

# ============================================
# CONFIGURATION
# ============================================
MODEL_PATH = os.path.join(os.path.dirname(__file__), "2x_AniSD_AC_G6i2a_Compact_72500_fp16.onnx")

# Global stop events for threads
decode_stop_event = threading.Event()
encode_stop_event = threading.Event()

# ============================================
# HELPER FUNCTIONS
# ============================================

def probe_video(input_path):
    """
    Dùng ffprobe để lấy width, height, fps của video
    """
    cmd = [
        'ffprobe',
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,avg_frame_rate',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        input_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    lines = result.stdout.strip().split('\n')
    
    width = int(lines[0])
    height = int(lines[1])
    
    # Parse fps (có thể là fraction như "30000/1001")
    fps_str = lines[2]
    if '/' in fps_str:
        num, den = fps_str.split('/')
        fps = float(num) / float(den)
    else:
        fps = float(fps_str)
    
    return width, height, fps


def create_onnx_session():
    """
    Tạo ONNX session với CUDA, fallback CPU nếu lỗi
    Optimized cho FP16 model + GTX 1650
    """
    print(f"[Upscale] Loading model: {os.path.basename(MODEL_PATH)}")
    
    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    sess_options.enable_cpu_mem_arena = False
    sess_options.enable_mem_pattern = True
    sess_options.enable_mem_reuse = True
    sess_options.intra_op_num_threads = 1
    sess_options.inter_op_num_threads = 1
    
    try:
        # Simple providers without config for fp16
        providers = [
            'CUDAExecutionProvider',
            'CPUExecutionProvider'
        ]
        session = ort.InferenceSession(MODEL_PATH, sess_options=sess_options, providers=providers)
        
        provider = session.get_providers()[0]
        print(f"[Upscale] Using: {provider}")
        
    except Exception as e:
        print(f"[Upscale] CUDA failed, falling back to CPU: {e}")
        session = ort.InferenceSession(MODEL_PATH, sess_options=sess_options, providers=['CPUExecutionProvider'])
        print("[Upscale] Using: CPUExecutionProvider")
    
    return session


def bgr24_to_tensor(bgr_data, width, height):
    """
    Convert BGR24 byte array -> RGB float tensor [1, 3, H, W]
    Tương tự Bgr24ToBatchTensor() trong ImageByteArrayUpscaler.cs
    FP16 model - use float16 for better GPU performance
    """
    # BGR24 layout: BGRBGRBGR... (interleaved)
    # Reshape to [H, W, 3]
    bgr_array = np.frombuffer(bgr_data, dtype=np.uint8).reshape(height, width, 3)
    
    # BGR -> RGB
    rgb_array = bgr_array[:, :, ::-1]  # Reverse last dimension
    
    # Normalize to [0, 1] - use float16 for fp16 model
    rgb_float = rgb_array.astype(np.float16) / 255.0
    
    # HWC -> CHW: [H, W, 3] -> [3, H, W]
    chw = np.transpose(rgb_float, (2, 0, 1))
    
    # Add batch dimension: [3, H, W] -> [1, 3, H, W]
    tensor = np.expand_dims(chw, axis=0)
    
    return tensor


def tensor_to_bgr24(output_tensor):
    """
    Convert RGB float tensor [1, 3, H, W] -> BGR24 byte array
    Tương tự BatchTensorToBgr24() trong ImageByteArrayUpscaler.cs
    """
    # Remove batch: [1, 3, H, W] -> [3, H, W]
    rgb_chw = output_tensor[0]
    
    # CHW -> HWC: [3, H, W] -> [H, W, 3]
    rgb_hwc = np.transpose(rgb_chw, (1, 2, 0))
    
    # Clip and denormalize: [0, 1] -> [0, 255]
    rgb_uint8 = np.clip(rgb_hwc * 255.0, 0, 255).astype(np.uint8)
    
    # RGB -> BGR
    bgr_uint8 = rgb_uint8[:, :, ::-1]
    
    return bgr_uint8.tobytes()


def drain_stderr(process, stop_event):
    """
    Drain stderr continuously to prevent buffer blocking
    CRITICAL: FFmpeg will block if stderr buffer fills up!
    Fixed: Use stop_event to gracefully shutdown without stderr conflicts
    """
    try:
        while not stop_event.is_set():
            line = process.stderr.readline()
            if not line:
                break
            # Silently discard to avoid threading issues at shutdown
    except:
        pass


def start_decode_process(input_path):
    """
    Start FFmpeg decode process: video -> raw BGR24 frames to stdout
    Tương tự StartDecodeProcess() trong Program.cs
    """
    cmd = [
        'ffmpeg',
        '-v', 'error',
        '-i', input_path,
        '-f', 'rawvideo',
        '-pix_fmt', 'bgr24',
        'pipe:1'
    ]
    
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=10**8  # 100MB buffer
    )
    
    # Start stderr drain thread with stop event
    stderr_thread = threading.Thread(target=drain_stderr, args=(process, decode_stop_event), daemon=True)
    stderr_thread.start()
    
    return process, stderr_thread


def start_encode_process(input_path, output_path, width, height, fps):
    """
    Start FFmpeg encode process: stdin raw BGR24 -> video with audio
    Tương tự StartEncodeProcess() trong Program.cs
    
    Sử dụng libx264 (software encoder) - stable and compatible
    """
    cmd = [
        'ffmpeg',
        '-y',  # Overwrite output
        '-f', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-s', f'{width}x{height}',
        '-r', str(fps),
        '-i', 'pipe:0',  # stdin for video
        '-i', input_path,  # Original video for audio
        '-map', '0:v:0',  # Video from stdin
        '-map', '1:a?',   # Audio from input (optional)
        '-c:v', 'libx264',  # Software encoder (always works)
        '-preset', 'medium',  # Balanced speed/quality
        '-crf', '23',  # Quality (lower = better, 18-28 is good)
        '-pix_fmt', 'yuv420p',
        '-c:a', 'copy',  # Copy audio
        '-shortest',  # End when shortest stream ends
        output_path
    ]
    
    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=10**8  # 100MB buffer
    )
    
    # Start stderr drain thread with stop event
    stderr_thread = threading.Thread(target=drain_stderr, args=(process, encode_stop_event), daemon=True)
    stderr_thread.start()
    
    return process, stderr_thread


# ============================================
# MAIN PROCESSING
# ============================================

def process_video(input_path, output_path):
    """
    Main video processing pipeline
    Tương tự ProcessVideoAsync() trong Program.cs
    """
    
    # Reset stop events
    decode_stop_event.clear()
    encode_stop_event.clear()
    
    # Validate input
    if not Path(input_path).exists():
        raise FileNotFoundError(f"Input video not found: {input_path}")
    
    # Probe video info
    print(f"[Upscale] Input: {input_path}")
    width, height, fps = probe_video(input_path)
    print(f"[Upscale] Video: {width}x{height} @ {fps:.2f}fps")
    
    # Create ONNX session
    session = create_onnx_session()
    input_name = session.get_inputs()[0].name
    
    # Start decode process
    print(f"[Upscale] Starting decode process...")
    decode_process, decode_thread = start_decode_process(input_path)
    
    # Calculate frame size
    frame_size = width * height * 3  # BGR24 = 3 bytes per pixel
    
    # Process frames
    frame_index = 0
    encode_process = None
    encode_thread = None
    encode_stdin = None
    
    total_upscale_time = 0.0
    total_encode_time = 0.0
    
    start_time = time.time()
    last_log_time = start_time
    
    print(f"[Upscale] Processing frames...")
    
    try:
        while True:
            # Read one frame from decode stdout
            frame_data = decode_process.stdout.read(frame_size)
            
            if len(frame_data) == 0:
                # End of stream
                break
            
            if len(frame_data) != frame_size:
                print(f"[Upscale] Incomplete frame at index {frame_index}, skipping...")
                break
            
            # Upscale frame
            upscale_start = time.time()
            
            # BGR -> tensor
            input_tensor = bgr24_to_tensor(frame_data, width, height)
            
            # Run model
            output_tensor = session.run(None, {input_name: input_tensor})[0]
            
            # Tensor -> BGR
            output_bgr = tensor_to_bgr24(output_tensor)
            
            upscale_time = time.time() - upscale_start
            total_upscale_time += upscale_time
            
            # Get output dimensions from first frame
            if encode_process is None:
                output_height, output_width = output_tensor.shape[2], output_tensor.shape[3]
                print(f"[Upscale] Output: {output_width}x{output_height}")
                print(f"[Upscale] Starting encode process...")
                
                # Start encode process
                encode_process, encode_thread = start_encode_process(
                    input_path, 
                    output_path, 
                    output_width, 
                    output_height, 
                    fps
                )
                encode_stdin = encode_process.stdin
            
            # Write to encode stdin
            encode_start = time.time()
            encode_stdin.write(output_bgr)
            encode_stdin.flush()  # CRITICAL: Flush immediately
            encode_time = time.time() - encode_start
            total_encode_time += encode_time
            
            frame_index += 1
            
            # Log every 10 seconds
            current_time = time.time()
            if current_time - last_log_time >= 10:
                elapsed = current_time - start_time
                fps_current = frame_index / elapsed if elapsed > 0 else 0
                print(f"[Upscale] Frame {frame_index} | {fps_current:.2f} fps | Upscale: {upscale_time*1000:.1f}ms")
                last_log_time = current_time
    
    except KeyboardInterrupt:
        print(f"[Upscale] Interrupted by user")
    
    finally:
        # Signal threads to stop
        decode_stop_event.set()
        encode_stop_event.set()
        
        # Close encode stdin
        if encode_stdin:
            try:
                encode_stdin.close()
            except:
                pass
        
        # Wait for processes
        try:
            decode_process.wait(timeout=5)
        except:
            decode_process.kill()
        
        if encode_process:
            print(f"[Upscale] Finalizing output...")
            try:
                encode_process.wait(timeout=10)
            except:
                encode_process.kill()
        
        # Wait for threads to finish (with timeout)
        if decode_thread:
            decode_thread.join(timeout=2)
        if encode_thread:
            encode_thread.join(timeout=2)
    
    # Summary
    total_time = time.time() - start_time
    
    print(f"[Upscale] Completed: {frame_index} frames in {total_time:.2f}s")
    if frame_index > 0:
        print(f"[Upscale] Average FPS: {frame_index / total_time:.2f}")
        print(f"[Upscale] Upscale time: {total_upscale_time:.2f}s ({total_upscale_time/frame_index*1000:.1f}ms/frame)")
        print(f"[Upscale] Encode time: {total_encode_time:.2f}s")
    print(f"[Upscale] Output: {output_path}")


# ============================================
# ENTRY POINT
# ============================================

def main():
    if len(sys.argv) < 2:
        print("Usage: python upscale_video.py <input_video>")
        print("\nExamples:")
        print("  python upscale_video.py demo.mp4")
        print("  python upscale_video.py segment.ts")
        print("  python upscale_video.py input.mkv")
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    # Generate output filename
    input_pathobj = Path(input_path)
    output_path = str(input_pathobj.parent / f"{input_pathobj.stem}_upscaled.mp4")
    
    # Check model exists
    if not Path(MODEL_PATH).exists():
        print(f"[Upscale] Error: Model not found at {MODEL_PATH}")
        print(f"Please place the model file in the same directory as this script.")
        sys.exit(1)
    
    # Process video
    try:
        process_video(input_path, output_path)
    except Exception as e:
        print(f"[Upscale] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
