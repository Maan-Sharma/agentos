# Contributing to AgentOS

Thanks for your interest in contributing! To keep the project clean and easy to review, please follow the rules below.

## Contribution rules

1. **Fork the repository.** Do not push directly to this repo. Click **Fork** on https://github.com/Maan-Sharma/agentos to create your own copy.
2. **Create your own branch.** Never work on `main`. Create a new branch in your fork for every issue or feature.
3. **Link an issue.** Every pull request should reference an existing issue (for example, `Closes #1`). If there isn't one, open an issue first and wait for it to be discussed.
4. **Keep pull requests focused.** One issue or feature per pull request.
5. **Open a pull request** from your branch to the `main` branch of this repo.

## Step-by-step workflow

```bash
# 1. Fork the repo on GitHub, then clone YOUR fork
git clone https://github.com/<your-username>/agentos.git
cd agentos

# 2. Add the original repo as "upstream"
git remote add upstream https://github.com/Maan-Sharma/agentos.git

# 3. Keep your fork up to date
git fetch upstream
git checkout main
git merge upstream/main

# 4. Create your own branch
git checkout -b feature/short-description

# 5. Make your changes, then commit
git add .
git commit -m "feat: short description of the change"

# 6. Push the branch to your fork
git push origin feature/short-description
```

Then go to your fork on GitHub and click **Compare & pull request**.

## Branch naming

Use a short, descriptive name with a prefix:

| Prefix | Use for |
| --- | --- |
| `feature/` | New features (e.g. `feature/login-screen`) |
| `fix/` | Bug fixes (e.g. `fix/google-auth-redirect`) |
| `docs/` | Documentation changes |
| `chore/` | Maintenance and tooling |

## Commit messages

Write clear, present-tense messages, ideally with a prefix such as `feat:`, `fix:`, `docs:` or `chore:`.

## Pull request checklist

- [ ] I forked the repo and worked on my own branch (not `main`)
- [ ] My PR is linked to an issue
- [ ] My code runs without errors
- [ ] I did not commit secrets, API keys, or `.env` files
- [ ] I described what I changed and why

## Code of conduct

Be respectful and constructive. Harassment or abusive behavior will not be tolerated.

## Questions?

Open an issue and we'll help you out.
