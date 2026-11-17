#!/usr/bin/env bash
set -euo pipefail
# Never enable shell tracing: the token must stay in the process environment.
if [[ "${GITHUB_REF:-}" != refs/heads/main ]]; then
  echo 'Collector publishing is restricted to main.' >&2
  exit 1
fi
if [[ "${GITHUB_REPOSITORY:-}" != mentamaru/mizuho-maru-un-official-fun-site ]]; then
  echo 'Unexpected collector repository.' >&2
  exit 1
fi
if [[ -z "${COLLECTOR_TOKEN:-}" ]]; then
  echo 'Collector App token is required.' >&2
  exit 1
fi
# Reset inherited helpers and Authorization headers. No token in argv, remote URL,
# local git config or a credential file. The helper only answers credential reads.
GIT_TERMINAL_PROMPT=0 git \
  -c credential.helper= \
  -c 'credential.helper=!f() { if [ "$1" = get ]; then printf "%s\n" "username=x-access-token" "password=$COLLECTOR_TOKEN"; fi; }; f' \
  -c http.extraHeader= \
  push 'https://github.com/mentamaru/mizuho-maru-un-official-fun-site.git' HEAD:refs/heads/main
