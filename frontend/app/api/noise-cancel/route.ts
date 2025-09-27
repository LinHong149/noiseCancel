import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

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
      const scriptPath = path.join(process.cwd(), '../../backend/main.py');
      
      pythonProcess = spawn('python3', [scriptPath], {
        cwd: path.join(process.cwd(), '../../backend'),
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
