#!/usr/bin/env sh

set -eu

script_path="${1:?expected Bun script path}"
shift || true

append_path() {
  candidate="$1"

  if [ ! -d "$candidate" ]; then
    return
  fi

  case ":${PATH:-}:" in
    *":$candidate:"*)
      return
      ;;
    *)
      PATH="$candidate${PATH:+:$PATH}"
      ;;
  esac
}

if [ -n "${BUN_INSTALL:-}" ]; then
  append_path "$BUN_INSTALL/bin"
fi

append_path "$HOME/.bun/bin"
append_path "$HOME/.local/bin"
append_path "/usr/local/bin"
append_path "/opt/homebrew/bin"
append_path "/home/linuxbrew/.linuxbrew/bin"

export PATH

if command -v bun >/dev/null 2>&1; then
  exec bun "$script_path" "$@"
fi

printf '%s\n' '{"continue":true,"systemMessage":"Hook runtime could not find Bun. Checked PATH, BUN_INSTALL/bin, and common install locations such as ~/.bun/bin."}'