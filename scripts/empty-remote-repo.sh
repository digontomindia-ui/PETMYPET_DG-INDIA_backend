#!/usr/bin/env bash
set -euo pipefail

# Empties the "origin" remote's GitHub repo: deletes every branch except the
# default one, then force-pushes a single empty orphan commit onto the
# default branch. All history on every branch is destroyed remotely.
#
# Your local repo (the one you run this from) is NEVER touched — this script
# clones into a throwaway temp directory and operates only there.
#
# DESTRUCTIVE AND IRREVERSIBLE. GitHub may retain unreachable objects for a
# while server-side, but do not rely on that to recover anything. This does
# NOT remove already-leaked secrets from anyone who already cloned/forked —
# rotate those separately.
#
# Usage: run from anywhere inside the repo you want to empty.
#   ./scripts/empty-remote-repo.sh

REMOTE_URL="$(git remote get-url origin)"
REPO_NAME="$(basename -s .git "$REMOTE_URL")"

echo "This will PERMANENTLY erase all history and files on EVERY branch of:"
echo "  $REMOTE_URL"
echo "Your local repo here is not touched."
echo
read -rp "Type the repo name (\"$REPO_NAME\") to confirm: " CONFIRM
if [[ "$CONFIRM" != "$REPO_NAME" ]]; then
  echo "Confirmation did not match. Aborting."
  exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "Cloning into throwaway workspace..."
git clone --bare "$REMOTE_URL" "$WORKDIR/repo.git"
cd "$WORKDIR/repo.git"

DEFAULT_BRANCH="$(git symbolic-ref --short HEAD)"
echo "Default branch: $DEFAULT_BRANCH (this one will be kept, emptied)"

for ref in $(git for-each-ref --format='%(refname:short)' refs/heads/); do
  if [[ "$ref" != "$DEFAULT_BRANCH" ]]; then
    echo "Deleting branch: $ref"
    git push origin --delete "$ref"
  fi
done

for tag in $(git for-each-ref --format='%(refname:short)' refs/tags/); do
  echo "Deleting tag: $tag"
  git push origin --delete "refs/tags/$tag"
done

# Well-known SHA-1 of an empty git tree — valid in every repository.
EMPTY_TREE="4b825dc642cb6eb9a060e54bf8d69288fbee4904"
EMPTY_COMMIT="$(git commit-tree "$EMPTY_TREE" -m "chore: reset repository")"
echo "Force-pushing empty commit to $DEFAULT_BRANCH..."
git push origin "$EMPTY_COMMIT:refs/heads/$DEFAULT_BRANCH" --force

echo
echo "Done. Remote now has only '$DEFAULT_BRANCH', pointing at one empty commit."
echo "Your local repo still has full history — nothing here changed."
