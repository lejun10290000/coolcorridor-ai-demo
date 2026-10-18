// The evidence-gated workflow supersedes the old one-click lifecycle smoke test.
// Keep the previous entry point/preview port usable for existing handoff commands.
process.env.WORKFLOW_APP_URL ||= process.env.CAMPUS_APP_URL || 'http://127.0.0.1:4174'
require('./check-developer-workflow.cjs')
