$env:ANTHROPIC_BASE_URL = "http://localhost:20128"
$env:ANTHROPIC_AUTH_TOKEN = "sk-or-3192a9e2d1ef38943e2d2b165374bc43a47417991b76bca4"
$env:ANTHROPIC_MODEL = "antigravity/claude-sonnet-4-6"

Write-Host "🚀 Launching Claude Code with Claude Sonnet 4.6 (Thinking) via OmniRoute..." -ForegroundColor Cyan
claude $args
