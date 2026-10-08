# READY_JS_PACKAGES dependency installers

Each package group has `install-dependencies.ps1` and
`install-dependencies.bat`, plus a `configuration.yaml` with package-specific
settings. Run either installer to check the package's declared dependencies;
missing packages are installed according to the `dependencies` settings in
that YAML file.

The shared `Install-PackageDependencies.ps1` helper also checks nested package
manifests, while skipping `node_modules` and `.git`. If a group has no
`package.json`, the installer reports that there is nothing to install. The
`dependencies` configuration supports `enabled`, `packageManager` (`auto`,
`npm`, `pnpm`, or `yarn`), `includeDevDependencies`, and `installMode`
(`install`, `ci`, or `frozen`).
Configuration files use YAML mappings and scalar values (strings, booleans,
numbers, and null); unsupported YAML syntax is rejected rather than ignored.

Read a package's parsed configuration as JSON with:

```powershell
powershell.exe -NoProfile -File .\15-openpgpjs\get-configuration.ps1
```

Package-specific settings are exposed to PowerShell through the package's
`get-configuration.ps1` script. Packages with JavaScript implementations also
load their YAML settings at runtime through a YAML parser.

The batch file runs the PowerShell script with the process-scoped execution
policy bypassed; no machine-wide policy or settings are changed.
