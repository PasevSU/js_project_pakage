[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $PackagePath
)

$ErrorActionPreference = 'Stop'

function Get-DeclaredDependencies {
    param(
        [object] $Manifest,
        [bool] $IncludeDevDependencies
    )

    $names = @()
    $sections = @('dependencies')
    if ($IncludeDevDependencies) {
        $sections += 'devDependencies'
    }
    foreach ($sectionName in $sections) {
        $section = $Manifest.PSObject.Properties[$sectionName]
        if ($null -ne $section -and $null -ne $section.Value) {
            $names += @($section.Value.PSObject.Properties | ForEach-Object { $_.Name })
        }
    }
    return @($names | Sort-Object -Unique)
}

function Test-DependencyInstalled {
    param(
        [string] $Name,
        [string] $ManifestDirectory,
        [string] $PackageRoot
    )

    $relativeName = $Name.Replace('/', [IO.Path]::DirectorySeparatorChar)
    $directory = [IO.Path]::GetFullPath($ManifestDirectory)
    $boundary = Split-Path -Parent ([IO.Path]::GetFullPath($PackageRoot))

    while ($directory.StartsWith($boundary, [StringComparison]::OrdinalIgnoreCase)) {
        $installedDirectory = Join-Path (Join-Path $directory 'node_modules') $relativeName
        $installedManifest = Join-Path $installedDirectory 'package.json'
        if (Test-Path -LiteralPath $installedManifest -PathType Leaf) {
            try {
                $installed = Get-Content -LiteralPath $installedManifest -Raw | ConvertFrom-Json
                if ($installed.name -eq $Name -and -not [string]::IsNullOrWhiteSpace([string]$installed.version)) {
                    if (-not $installed.main -or (Test-Path -LiteralPath (Join-Path $installedDirectory ([string]$installed.main)) -PathType Leaf)) {
                        return $true
                    }
                }
            }
            catch {
                return $false
            }
        }
        if ($directory.Equals($boundary, [StringComparison]::OrdinalIgnoreCase)) {
            break
        }
        $directory = Split-Path -Parent $directory
    }
    return $false
}

function Get-PackageManager {
    param(
        [object] $Manifest,
        [string] $ManifestDirectory
    )

    $packageManagerProperty = $Manifest.PSObject.Properties['packageManager']
    if ($null -ne $packageManagerProperty -and $packageManagerProperty.Value) {
        return ([string]$packageManagerProperty.Value -split '@', 2)[0]
    }
    if (Test-Path -LiteralPath (Join-Path $ManifestDirectory 'pnpm-lock.yaml')) {
        return 'pnpm'
    }
    if (Test-Path -LiteralPath (Join-Path $ManifestDirectory 'yarn.lock')) {
        return 'yarn'
    }
    return 'npm'
}

try {
    $root = (Resolve-Path -LiteralPath $PackagePath).Path
    $configurationLoader = Join-Path $PSScriptRoot 'Get-PackageConfiguration.ps1'
    $configuration = (& $configurationLoader -PackagePath $root -AsJson | ConvertFrom-Json)
    $installSettings = $configuration.dependencies
    if ($null -eq $installSettings) {
        throw "The dependencies section is missing from configuration.yaml in '$root'."
    }
    if ($installSettings.enabled -eq $false) {
        Write-Host "Dependency installation is disabled in configuration.yaml for '$root'."
        exit 0
    }
    $includeDevDependencies = $installSettings.includeDevDependencies -ne $false
    $installMode = [string]$installSettings.installMode
    if (-not $installMode) {
        $installMode = 'install'
    }
    if ($installMode -notin @('install', 'ci', 'frozen')) {
        throw "Unsupported dependencies.installMode '$installMode' in configuration.yaml."
    }

    $manifests = @(
        Get-ChildItem -LiteralPath $root -Filter 'package.json' -File -Recurse |
            Where-Object {
                $_.FullName -notmatch '[\\/](node_modules|\.git)[\\/]'
            } |
            Sort-Object FullName
    )

    if ($manifests.Count -eq 0) {
        Write-Host "No package.json found under '$root'; nothing to install."
        exit 0
    }

    $failureCount = 0
    foreach ($manifestFile in $manifests) {
        $manifestDirectory = $manifestFile.DirectoryName
        try {
            $manifest = Get-Content -LiteralPath $manifestFile.FullName -Raw | ConvertFrom-Json
            $dependencies = @(
                Get-DeclaredDependencies -Manifest $manifest -IncludeDevDependencies $includeDevDependencies
            )
            if ($dependencies.Count -eq 0) {
                Write-Host "No dependencies declared: $($manifestFile.FullName)"
                continue
            }

            $manager = [string]$installSettings.packageManager
            if (-not $manager -or $manager -eq 'auto') {
                $manager = Get-PackageManager -Manifest $manifest -ManifestDirectory $manifestDirectory
            }
            if ($manager -notin @('npm', 'pnpm', 'yarn')) {
                throw "Unsupported dependencies.packageManager '$manager' in configuration.yaml."
            }
            $command = Get-Command $manager -ErrorAction SilentlyContinue
            if ($null -eq $command) {
                throw "Package manager '$manager' is not installed or is not on PATH."
            }

            $missing = @(
                $dependencies | Where-Object {
                    -not (Test-DependencyInstalled -Name $_ -ManifestDirectory $manifestDirectory -PackageRoot $root)
                }
            )
            $invalidVersionTree = $false
            if ($missing.Count -eq 0) {
                Push-Location -LiteralPath $manifestDirectory
                try {
                    switch ($manager) {
                        'npm' { $null = & $command.Source ls --depth=0 --json 2>$null }
                        'pnpm' { $null = & $command.Source list --depth=0 --json 2>$null }
                        'yarn' { $null = & $command.Source check --integrity 2>$null }
                    }
                    $invalidVersionTree = $LASTEXITCODE -ne 0
                }
                finally {
                    Pop-Location
                }
            }
            $forceInstall = $installMode -in @('ci', 'frozen') -or $invalidVersionTree
            if ($missing.Count -eq 0 -and -not $forceInstall) {
                Write-Host "Dependencies present: $($manifestFile.FullName)"
                continue
            }

            Write-Host "Installing missing dependencies for $($manifestFile.FullName): $($missing -join ', ')"
            Push-Location -LiteralPath $manifestDirectory
            try {
                switch ($manager) {
                    'npm' {
                        if ($installMode -in @('ci', 'frozen')) {
                            if ($includeDevDependencies) { & $command.Source ci }
                            else { & $command.Source ci --omit=dev }
                        }
                        elseif ($includeDevDependencies) { & $command.Source install }
                        else { & $command.Source install --omit=dev }
                    }
                    'pnpm' {
                        $arguments = @('install')
                        if ($installMode -in @('ci', 'frozen')) { $arguments += '--frozen-lockfile' }
                        if (-not $includeDevDependencies) { $arguments += '--prod' }
                        & $command.Source @arguments
                    }
                    'yarn' {
                        $arguments = @('install')
                        if ($installMode -in @('ci', 'frozen')) { $arguments += '--frozen-lockfile' }
                        if (-not $includeDevDependencies) { $arguments += '--production=true' }
                        & $command.Source @arguments
                    }
                    default { throw "Unsupported package manager '$manager'." }
                }
                if ($LASTEXITCODE -ne 0) {
                    throw "'$manager install' failed with exit code $LASTEXITCODE."
                }
            }
            finally {
                Pop-Location
            }

            $stillMissing = @(
                $dependencies | Where-Object {
                    -not (Test-DependencyInstalled -Name $_ -ManifestDirectory $manifestDirectory -PackageRoot $root)
                }
            )
            if ($stillMissing.Count -gt 0) {
                throw "Dependencies are still missing after installation: $($stillMissing -join ', ')."
            }
            Write-Host "Dependencies installed: $($manifestFile.FullName)"
        }
        catch {
            $failureCount++
            [Console]::Error.WriteLine("Failed to process '$($manifestFile.FullName)': $($_.Exception.Message)")
        }
    }

    if ($failureCount -gt 0) {
        exit 1
    }
    exit 0
}
catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
