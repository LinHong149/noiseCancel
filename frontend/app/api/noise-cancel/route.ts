import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

let pythonProcess: any = null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // 'start' or 'stop'

    if (action === 'start') {
      // Stop existing process if running
      if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
      }

      // Start the Python noise cancellation script
      const scriptPath = path.join(process.cwd(), '../backend/main.py');
      const pythonPath = path.join(process.cwd(), '../backend/venv/bin/python3');
      const backendPath = path.join(process.cwd(), '../backend');
      
      console.log('=== Python Process Debug Info ===');
      console.log('Current working directory:', process.cwd());
      console.log('Script path:', scriptPath);
      console.log('Python path:', pythonPath);
      console.log('Backend path:', backendPath);
      console.log('Script exists:', fs.existsSync(scriptPath));
      console.log('Python exists:', fs.existsSync(pythonPath));
      console.log('Backend directory exists:', fs.existsSync(backendPath));
      console.log('===================================');
      
      pythonProcess = spawn(pythonPath, [scriptPath], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      pythonProcess.stdout.on('data', (data: Buffer) => {
        console.log(`Python stdout: ${data}`);
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        console.error(`Python stderr: ${data}`);
      });

      pythonProcess.on('close', (code: number) => {
        console.log(`Python process exited with code ${code}`);
        pythonProcess = null;
      });

      pythonProcess.on('error', (error: Error) => {
        console.error('Failed to start Python process:', error);
        console.error('Error details:', {
          errno: error.errno,
          code: error.code,
          syscall: error.syscall,
          path: error.path,
          spawnargs: error.spawnargs
        });
        pythonProcess = null;
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Noise cancellation started',
        pid: pythonProcess.pid 
      });

    } else if (action === 'stop') {
      if (pythonProcess) {
        pythonProcess.kill();
        pythonProcess = null;
        return NextResponse.json({ 
          success: true, 
          message: 'Noise cancellation stopped' 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          message: 'No process running' 
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error controlling noise cancellation:', error);
    return NextResponse.json(
      { error: 'Failed to control noise cancellation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    isRunning: pythonProcess !== null,
    pid: pythonProcess?.pid || null
  });
}
