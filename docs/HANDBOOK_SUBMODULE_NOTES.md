# Handbook Submodule Usage Notes

This document explains how to work with the `docs/handbook-mount` Git submodule.

## Overview

The `docs/handbook-mount` directory is a Git submodule pointing to the `pbcex-handbook` repository. This allows us to include the canonical business plan, architecture, legal documents, and decision logs directly in our workspace.

## Common Operations

### Update Submodule to Latest

```bash
git submodule update --remote --merge docs/handbook-mount
```

### Pull All Changes (including submodule updates)

```bash
git pull --recurse-submodules
```

### Push Pointer After Update

After updating the submodule, you need to commit the pointer update in the parent repo:

```bash
git add docs/handbook-mount
git commit -m "docs: update handbook submodule pointer"
git push
```

## CI/CD Note

**Important**: CI actions must enable submodules with `recursive` option:

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
```

## Troubleshooting

### Submodule Not Populated

If you clone the repo and the submodule directory is empty:

```bash
git submodule update --init --recursive
```

### Submodule Checkout Issues

If the submodule is in a detached HEAD state:

```bash
cd docs/handbook-mount
git checkout main
cd ../..
git add docs/handbook-mount
git commit -m "docs: update submodule to track main branch"
```

## CI Usage

**Important**: CI workflows must enable submodules with `recursive` option:

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
    fetch-depth: 0
```

For integrity verification, add this step after checkout:

```yaml
- name: Verify handbook submodule
  run: |
    git submodule status --recursive
    test -f docs/handbook-mount/docs/index.md
```

To update the submodule pointer in CI/CD:

```bash
git submodule update --remote --merge docs/handbook-mount
git add docs/handbook-mount
git commit -m "docs: update handbook submodule pointer"
```

## Repository Links

- **Parent Repo**: `abes-pbcex-workspace`
- **Submodule Repo**: [`pbcex-handbook`](https://github.com/Abe99987/pbcex-handbook.git)
- **Tracking Branch**: `main`
