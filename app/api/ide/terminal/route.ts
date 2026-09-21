import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const WORKSPACE_ROOT = process.cwd();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command, cwd = '' } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ success: false, error: 'Command is required' }, { status: 400 });
    }

    const trimmedCmd = command.trim();

    // Resolve working directory
    let effectiveCwd = WORKSPACE_ROOT;
    if (cwd && typeof cwd === 'string') {
      const candidateCwd = path.isAbsolute(cwd) ? cwd : path.join(WORKSPACE_ROOT, cwd);
      if (fs.existsSync(candidateCwd) && fs.statSync(candidateCwd).isDirectory()) {
        effectiveCwd = candidateCwd;
      }
    }

    // Special handling for "cd <dir>"
    if (trimmedCmd.startsWith('cd ') || trimmedCmd === 'cd') {
      const targetDir = trimmedCmd.substring(2).trim() || WORKSPACE_ROOT;
      const resolvedTarget = path.isAbsolute(targetDir) 
        ? targetDir 
        : path.resolve(effectiveCwd, targetDir);

      if (fs.existsSync(resolvedTarget) && fs.statSync(resolvedTarget).isDirectory()) {
        const displayCwd = path.relative(WORKSPACE_ROOT, resolvedTarget) || '~';
        return NextResponse.json({
          success: true,
          command: trimmedCmd,
          stdout: '',
          stderr: '',
          exitCode: 0,
          cwd: displayCwd === '' ? '~' : displayCwd,
          absoluteCwd: resolvedTarget
        });
      } else {
        return NextResponse.json({
          success: false,
          command: trimmedCmd,
          stdout: '',
          stderr: `cd: no such file or directory: ${targetDir}`,
          exitCode: 1,
          cwd: path.relative(WORKSPACE_ROOT, effectiveCwd) || '~'
        });
      }
    }

    // Run command in child_process
    const startTime = Date.now();
    return new Promise<NextResponse>((resolve) => {
      exec(
        trimmedCmd,
        {
          cwd: effectiveCwd,
          timeout: 25000,
          maxBuffer: 1024 * 1024 * 5, // 5MB buffer
          env: {
            ...process.env,
            PAGER: 'cat',
            FORCE_COLOR: '1'
          }
        },
        (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;
          const displayCwd = path.relative(WORKSPACE_ROOT, effectiveCwd) || '~';

          resolve(
            NextResponse.json({
              success: !error || error.code === 0,
              command: trimmedCmd,
              stdout: stdout || '',
              stderr: stderr || (error ? error.message : ''),
              exitCode: error ? (error.code ?? 1) : 0,
              durationMs,
              cwd: displayCwd === '' ? '~' : displayCwd
            })
          );
        }
      );
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
