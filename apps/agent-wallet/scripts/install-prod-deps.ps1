$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Error 'pnpm is required. Install Node.js 20+ and run: corepack enable'
}

pnpm install --prod --frozen-lockfile --ignore-workspace
Write-Host 'agent-wallet production dependencies installed.'
