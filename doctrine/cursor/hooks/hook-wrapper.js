/**
 * Cursor hook wrapper for Windows: invokes the matching .ps1 script.
 * On non-Windows, invokes .sh if present; otherwise no-op.
 * Directives 014, 015, 040, 042 — work logs, prompts, HiC escalation, model discipline.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const hookName = process.argv[2];
const isWindows = process.platform === 'win32';
const hooksDir = path.join(__dirname);

let command;
let args;

if (isWindows) {
    const ps1Path = path.join(hooksDir, `${hookName}.ps1`);
    if (fs.existsSync(ps1Path)) {
        command = 'powershell.exe';
        args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1Path];
    } else {
        process.stdout.write('{}');
        process.exit(0);
    }
} else {
    const shPath = path.join(hooksDir, `${hookName}.sh`);
    if (fs.existsSync(shPath)) {
        command = 'bash';
        args = [shPath];
    } else {
        process.stdout.write('{}');
        process.exit(0);
    }
}

const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'inherit'] });
process.stdin.pipe(child.stdin);

let output = '';
child.stdout.on('data', (data) => { output += data.toString(); });
child.on('close', (code) => {
    process.stdout.write(output);
    process.exit(code);
});
