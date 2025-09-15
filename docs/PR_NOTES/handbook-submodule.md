# Handbook Submodule PR Notes

## Merge Order

- **✅ Merge PR #68 (submodule) first** - This was already merged
- ~~PR #67 (handbook stubs) - This was closed as redundant~~

## Local Development Tips

### Initial Clone

```bash
git clone --recurse-submodules https://github.com/Abe99987/abes-pbcex-workspace.git
```

### Update Existing Clone

```bash
git pull --recurse-submodules
```

### If Submodule Directory is Empty

```bash
git submodule update --init --recursive
```

## CI/CD Integration

All workflows now include:

- `submodules: recursive` in `actions/checkout@v4`
- `fetch-depth: 0` for complete history
- Integrity check step to verify `docs/handbook-mount/docs/index.md` exists

## Quick Access Files

After submodule is populated, these high-signal files are available:

- `docs/handbook-mount/docs/index.md` - Handbook overview
- `docs/handbook-mount/docs/vision-roadmap.md` - Product vision
- `docs/handbook-mount/decision-log/ADR-INDEX.md` - Architecture decisions

## Cursor Integration

The `.cursor/rules` file pre-opens these files automatically:

- Local guides: `docs/architecture/tldr.md`, `docs/roadmap/phase1_milestones.md`, `docs/contracts/trade_v1.md`
- Current status: `docs/journal/now.md`
- Handbook entry: `docs/handbook-mount/docs/index.md`
