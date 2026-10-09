# 18-repo-manager

Create a standard JavaScript project folder, publish a new GitHub repository,
push local commits or changes, and fast-forward local clones from their remote.
Use `sync` with a JSON list to process multiple local repositories.

Run the CLI from the repository root:

```powershell
node READY_JS_PACKAGES/18-repo-manager/cli.js create .\work\my-app
node READY_JS_PACKAGES/18-repo-manager/cli.js publish .\work\my-app --repo PasevSU/my-app --apply
node READY_JS_PACKAGES/18-repo-manager/cli.js update .\work\existing-repo --apply
node READY_JS_PACKAGES/18-repo-manager/cli.js push .\work\existing-repo --message "Update project" --apply
node READY_JS_PACKAGES/18-repo-manager/cli.js sync --config .\repositories.json --direction pull --apply
```

`publish` creates a **private** GitHub repository by default; pass `--public`
to make it public. It initializes Git, commits the directory contents, then
uses the authenticated `gh` CLI to create the remote and push the initial
branch. Confirm that the directory contains only files intended for publication.

`update`, `push`, and `sync` are dry runs unless `--apply` is supplied.
Pulls require a clean working tree and use fetch plus fast-forward-only merge.
Pushes never force; if local changes exist, `--message` is required and the
package commits those changes before pushing. GitHub operations require Git,
the GitHub CLI, and an authenticated `gh auth login` session.

Example `repositories.json`:

```json
{
  "repositories": [
    ".\\project-a",
    "..\\other-project"
  ]
}
```

Paths in this file are resolved relative to the JSON file. Sync runs in order
and reports an error immediately if a repository is dirty, lacks an upstream,
or encounters a non-fast-forward update.
