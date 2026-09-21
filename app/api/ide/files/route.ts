import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WORKSPACE_ROOT = process.cwd();

// Helper: check if path is within workspace for safety
function resolveSafePath(userPath: string): string {
  const normalized = path.normalize(userPath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.isAbsolute(normalized) 
    ? (normalized.startsWith(WORKSPACE_ROOT) ? normalized : path.join(WORKSPACE_ROOT, normalized))
    : path.join(WORKSPACE_ROOT, normalized);
  return fullPath;
}

function getExtension(filename: string): any {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'env', 'css', 'html', 'rs', 'go', 'py', 'sh', 'yml', 'yaml'].includes(ext)) {
    return ext;
  }
  return 'ts';
}

function buildTree(dirPath: string, relativeRoot = '', maxDepth = 3, currentDepth = 0): any[] {
  if (currentDepth > maxDepth) return [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const items: any[] = [];

    // Filter out heavy/hidden dirs
    const ignoreList = new Set(['node_modules', '.git', '.next', 'target', 'dist', 'build', '.system_generated', '.turbo']);

    for (const entry of entries) {
      if (ignoreList.has(entry.name) || entry.name.startsWith('.git/')) continue;

      const fullPath = path.join(dirPath, entry.name);
      const relPath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const children = buildTree(fullPath, relPath, maxDepth, currentDepth + 1);
        items.push({
          id: relPath,
          name: entry.name,
          path: relPath,
          type: 'folder',
          isOpen: currentDepth < 1,
          childrenCount: children.length,
          children
        });
      } else {
        items.push({
          id: relPath,
          name: entry.name,
          path: relPath,
          type: 'file',
          extension: getExtension(entry.name),
          status: 'none'
        });
      }
    }

    // Sort folders first, then alphabetically
    return items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
  } catch (err: any) {
    console.error('Error building tree:', err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'tree';
  const targetPath = searchParams.get('path') || '';

  try {
    if (action === 'tree') {
      const tree = buildTree(WORKSPACE_ROOT);
      return NextResponse.json({ success: true, root: WORKSPACE_ROOT, tree });
    }

    if (action === 'read') {
      if (!targetPath) {
        return NextResponse.json({ success: false, error: 'Path is required' }, { status: 400 });
      }
      const safePath = resolveSafePath(targetPath);
      if (!fs.existsSync(safePath)) {
        return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
      }
      const stat = fs.statSync(safePath);
      if (stat.isDirectory()) {
        return NextResponse.json({ success: false, error: 'Target is a directory' }, { status: 400 });
      }
      const content = fs.readFileSync(safePath, 'utf-8');
      return NextResponse.json({
        success: true,
        path: targetPath,
        content,
        size: stat.size,
        extension: getExtension(targetPath)
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, path: targetPath, content, isFolder, oldPath, newPath } = body;

    if (action === 'write') {
      if (!targetPath) return NextResponse.json({ success: false, error: 'Path required' }, { status: 400 });
      const safePath = resolveSafePath(targetPath);
      const parentDir = path.dirname(safePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(safePath, content ?? '', 'utf-8');
      return NextResponse.json({ success: true, message: 'Файл сәтті сақталды', path: targetPath });
    }

    if (action === 'create') {
      if (!targetPath) return NextResponse.json({ success: false, error: 'Path required' }, { status: 400 });
      const safePath = resolveSafePath(targetPath);
      if (fs.existsSync(safePath)) {
        return NextResponse.json({ success: false, error: 'Файл немесе папка бұрыннан бар' }, { status: 409 });
      }
      if (isFolder) {
        fs.mkdirSync(safePath, { recursive: true });
      } else {
        const parentDir = path.dirname(safePath);
        if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
        fs.writeFileSync(safePath, content || '', 'utf-8');
      }
      return NextResponse.json({ success: true, message: isFolder ? 'Папка құрылды' : 'Файл құрылды', path: targetPath });
    }

    if (action === 'delete') {
      if (!targetPath) return NextResponse.json({ success: false, error: 'Path required' }, { status: 400 });
      const safePath = resolveSafePath(targetPath);
      if (!fs.existsSync(safePath)) {
        return NextResponse.json({ success: false, error: 'Файл табылмады' }, { status: 404 });
      }
      const stat = fs.statSync(safePath);
      if (stat.isDirectory()) {
        fs.rmSync(safePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(safePath);
      }
      return NextResponse.json({ success: true, message: 'Жойылды', path: targetPath });
    }

    if (action === 'rename') {
      if (!oldPath || !newPath) return NextResponse.json({ success: false, error: 'Old and new path required' }, { status: 400 });
      const safeOld = resolveSafePath(oldPath);
      const safeNew = resolveSafePath(newPath);
      if (!fs.existsSync(safeOld)) {
        return NextResponse.json({ success: false, error: 'Бастапқы файл табылмады' }, { status: 404 });
      }
      fs.renameSync(safeOld, safeNew);
      return NextResponse.json({ success: true, message: 'Аты өзгертілді' });
    }

    return NextResponse.json({ success: false, error: 'Белгісіз әрекет' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
