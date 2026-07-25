import http from 'node:http'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const port = Number(process.env.PORT || 8081)
const timeoutMs = Number(process.env.EXECUTION_TIMEOUT_MS || 5000)
const maxOutputBytes = Number(process.env.MAX_OUTPUT_BYTES || 32768)
const maxBodyBytes = 256 * 1024

const languageCommands = {
  JavaScript: {
    file: 'solution.js',
    compile: null,
    run: ['node', ['solution.js']],
  },
  Python: {
    file: 'solution.py',
    compile: null,
    run: ['python3', ['solution.py']],
  },
  'C++': {
    file: 'solution.cpp',
    compile: ['g++', ['-std=c++20', '-O2', 'solution.cpp', '-o', 'solution']],
    run: ['./solution', []],
  },
}

function runProcess(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: { PATH: process.env.PATH, HOME: '/tmp' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let outputBytes = 0
    let timedOut = false

    const collect = (target) => (chunk) => {
      if (outputBytes >= maxOutputBytes) return
      const remaining = maxOutputBytes - outputBytes
      const text = chunk.subarray(0, remaining).toString()
      outputBytes += Buffer.byteLength(text)
      if (target === 'stdout') stdout += text
      else stderr += text
    }

    child.stdout.on('data', collect('stdout'))
    child.stderr.on('data', collect('stderr'))

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    child.on('error', (error) => {
      clearTimeout(timer)
      resolve({ exitCode: -1, stdout, stderr: `${stderr}${error.message}`, timedOut })
    })
    child.on('close', (exitCode) => {
      clearTimeout(timer)
      resolve({ exitCode: exitCode === null ? -1 : exitCode, stdout, stderr, timedOut })
    })
  })
}

async function execute({ language, code }) {
  if (typeof code !== 'string' || !code.trim()) {
    return {
      status: 'error',
      summary: 'No code to run',
      output: 'Add a solution before running it.',
      passedTests: 0,
      totalTests: 0,
    }
  }

  const directory = await mkdtemp(path.join(tmpdir(), 'traceround-'))

  try {
    let config = languageCommands[language]
    let fileName = config && config.file

    if (language === 'Java') {
      const classMatch = code.match(/public\s+class\s+([A-Za-z_$][\w$]*)/)
      const className = classMatch && classMatch[1] ? classMatch[1] : 'Main'
      fileName = `${className}.java`
      config = {
        compile: ['javac', [fileName]],
        run: ['java', ['-cp', '.', className]],
      }
    }

    if (!config) {
      return {
        status: 'error',
        summary: 'Unsupported language',
        output: `${language} is not enabled by TraceRound.`,
        passedTests: 0,
        totalTests: 0,
      }
    }

    await writeFile(path.join(directory, fileName), code, 'utf8')

    if (config.compile) {
      const compiled = await runProcess(config.compile[0], config.compile[1], directory)
      if (compiled.exitCode !== 0 || compiled.timedOut) {
        return {
          status: 'error',
          summary: compiled.timedOut ? 'Compilation timed out' : 'Compilation failed',
          output: (compiled.stderr || compiled.stdout || 'Compiler returned an error.').trim(),
          passedTests: 0,
          totalTests: 0,
        }
      }
    }

    const result = await runProcess(config.run[0], config.run[1], directory)
    const succeeded = result.exitCode === 0 && !result.timedOut

    return {
      status: succeeded ? 'success' : 'error',
      summary: result.timedOut
        ? 'Execution timed out'
        : succeeded
          ? 'Code executed successfully'
          : 'Execution failed',
      output: (result.stderr || result.stdout || 'Program completed without output.').trim(),
      passedTests: succeeded ? 1 : 0,
      totalTests: 1,
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const server = http.createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok', service: 'traceround-code-runner' }))
    return
  }

  if (request.method !== 'POST' || request.url !== '/execute') {
    response.writeHead(404, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  let body = ''
  let bodyBytes = 0
  request.on('data', (chunk) => {
    bodyBytes += chunk.length
    if (bodyBytes > maxBodyBytes) request.destroy()
    else body += chunk
  })
  request.on('end', async () => {
    try {
      const result = await execute(JSON.parse(body))
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify(result))
    } catch {
      response.writeHead(400, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid execution request' }))
    }
  })
})

server.listen(port, '0.0.0.0', () => {
  process.stdout.write(`TraceRound code runner listening on ${port}\\n`)
})
