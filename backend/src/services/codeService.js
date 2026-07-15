import { execSync } from 'child_process'
import { randomUUID } from 'crypto'
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const SANDBOX_DIR = join(tmpdir(), 'mcpherson-sandbox')
if (!existsSync(SANDBOX_DIR)) mkdirSync(SANDBOX_DIR, { recursive: true })

const TIMEOUT_MS = 10000

export async function executeCode(language, code) {
  const id = randomUUID().slice(0, 8)
  const start = Date.now()

  try {
    switch (language) {
      case 'python': {
        const file = join(SANDBOX_DIR, `script_${id}.py`)
        writeFileSync(file, code, 'utf8')
        const out = execSync(`python "${file}"`, { timeout: TIMEOUT_MS, cwd: SANDBOX_DIR })
        unlinkSync(file)
        return { output: out.toString(), elapsed: Date.now() - start }
      }
      case 'javascript':
      case 'js': {
        const file = join(SANDBOX_DIR, `script_${id}.mjs`)
        writeFileSync(file, code, 'utf8')
        const out = execSync(`node "${file}"`, { timeout: TIMEOUT_MS, cwd: SANDBOX_DIR })
        unlinkSync(file)
        return { output: out.toString(), elapsed: Date.now() - start }
      }
      case 'bash':
      case 'sh': {
        const file = join(SANDBOX_DIR, `script_${id}.sh`)
        writeFileSync(file, code, 'utf8')
        const out = execSync(`bash "${file}"`, { timeout: TIMEOUT_MS, cwd: SANDBOX_DIR })
        unlinkSync(file)
        return { output: out.toString(), elapsed: Date.now() - start }
      }
      default:
        return { error: `Unsupported language: ${language}. Supported: python, javascript, bash` }
    }
  } catch (e) {
    return {
      error: e.stderr?.toString() || e.message,
      output: e.stdout?.toString() || '',
      elapsed: Date.now() - start,
    }
  }
}
