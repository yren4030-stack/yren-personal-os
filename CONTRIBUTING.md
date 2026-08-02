# Contributing

Yren Personal OS is in early development. Contributions should stay small, reviewable, and within the public repository boundary.

## Workflow

1. Create a non-`main` branch from the current public `main`.
2. Make one focused change.
3. Run the relevant checks and review the complete diff.
4. Open a pull request using the repository template.
5. Resolve review conversations before merge.
6. Use squash merge so `main` remains linear.

Direct updates to `main`, force pushes, and history rewrites are not part of the normal workflow.

## Public-only content

Do not commit:

- secrets, tokens, credentials, private keys, or signing material;
- personal data, private plans, AI memory, production databases, backups, or private logs;
- local absolute paths, machine identifiers, or unredacted diagnostic output;
- internal governance, incident, risk, or confidential planning records;
- unlicensed code, fonts, images, media, datasets, models, or other third-party assets.

Use fictional, synthetic, anonymized, or fully redacted examples and test data.

## Code and documentation

- Keep changes focused and explain their purpose.
- Prefer explicit interfaces and secure defaults.
- Add or update tests when behavior changes.
- Update public documentation when user-facing behavior changes.
- Avoid unrelated formatting or generated-file churn.
- Do not weaken security or privacy boundaries without an explicit review discussion.

## Commit identity

Use a GitHub `noreply` address or another email address you intentionally accept publishing in Git commit metadata.

## License status

This repository currently has no open-source license. Contributions do not change that status unless a license is added explicitly.
