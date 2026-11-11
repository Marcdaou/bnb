#!/usr/bin/env bash
# Production gate for sdlc-loop: agents may reach a Vercel preview, never production.
input="$(cat)"
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
args=$(printf '%s' "$input" | jq -c '.tool_input // {}')
block(){ echo "BLOCKED by sdlc-loop production gate: $1. A human must do this." >&2; exit 2; }

if [[ "$tool" == "Bash" ]]; then
  echo "$cmd" | grep -Eq 'git push[^|;&]*\b(origin )?(main|master)\b' && block "push to main"
  echo "$cmd" | grep -Eq 'vercel[^|;&]*(--prod|promote)' && block "Vercel production deploy"
  echo "$cmd" | grep -Eq 'supabase[^|;&]*db push' && block "applying migrations to the linked Supabase project"
fi
case "$tool" in
  mcp__vercel__request_promote|mcp__vercel__assign_alias|mcp__vercel__request_rollback) block "$tool";;
  mcp__vercel__create_deployment) echo "$args" | grep -qi '"target":"production"' && block "production deployment";;
  mcp__supabase__apply_migration|mcp__supabase__merge_branch) block "$tool on Supabase";;
  mcp__supabase__execute_sql) echo "$args" | grep -Eqi '\b(insert|update|delete|drop|alter|create|truncate|grant)\b' && block "write SQL on Supabase";;
esac
exit 0
