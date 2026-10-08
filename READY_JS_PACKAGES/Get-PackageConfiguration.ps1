[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $PackagePath,

    [switch] $AsJson
)

$ErrorActionPreference = 'Stop'

function ConvertFrom-SimpleYaml {
    param([string] $Content)

    $root = @{}
    $stack = [Collections.Generic.List[object]]::new()
    $stack.Add([pscustomobject]@{ Indent = -1; Value = $root })
    $lineNumber = 0

    foreach ($line in ($Content -split '\r?\n')) {
        $lineNumber++
        if ($line -match '^\s*(?:#.*)?$') {
            continue
        }
        if ($line -match '^\t') {
            throw "Tabs are not allowed in YAML indentation (line $lineNumber)."
        }
        if ($line -notmatch '^( *)([A-Za-z0-9_.-]+):(?:\s+(.*)|\s*)$') {
            throw "Unsupported YAML syntax on line ${lineNumber}: $line"
        }

        $indent = $Matches[1].Length
        $key = $Matches[2]
        $rawValue = $Matches[3]
        while ($stack.Count -gt 1 -and $indent -le $stack[$stack.Count - 1].Indent) {
            $stack.RemoveAt($stack.Count - 1)
        }
        if ($indent -le $stack[$stack.Count - 1].Indent) {
            throw "Invalid YAML indentation on line $lineNumber."
        }

        $parent = $stack[$stack.Count - 1].Value
        if ($parent.ContainsKey($key)) {
            throw "Duplicate YAML key '$key' on line $lineNumber."
        }
        if ([string]::IsNullOrWhiteSpace($rawValue)) {
            $child = @{}
            $parent[$key] = $child
            $stack.Add([pscustomobject]@{ Indent = $indent; Value = $child })
            continue
        }

        $value = $rawValue.Trim()
        if ($value.StartsWith('"')) {
            $value = ConvertFrom-Json -InputObject $value
        }
        elseif ($value.StartsWith("'")) {
            if (-not $value.EndsWith("'")) {
                throw "Unterminated quoted value on line $lineNumber."
            }
            $value = $value.Substring(1, $value.Length - 2).Replace("''", "'")
        }
        elseif ($value -match '^(true|false)$') {
            $value = [bool]::Parse($value)
        }
        elseif ($value -match '^-?\d+$') {
            $value = [long]::Parse($value, [Globalization.CultureInfo]::InvariantCulture)
        }
        elseif ($value -match '^-?\d+\.\d+$') {
            $value = [double]::Parse($value, [Globalization.CultureInfo]::InvariantCulture)
        }
        elseif ($value -match '^(null|~)$') {
            $value = $null
        }
        else {
            $value = $value -replace '\s+#.*$', ''
        }
        $parent[$key] = $value
    }
    return ,$root
}

try {
    $root = (Resolve-Path -LiteralPath $PackagePath).Path
    $file = Join-Path $root 'configuration.yaml'
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        throw "Configuration file not found: $file"
    }

    $configuration = ConvertFrom-SimpleYaml -Content (Get-Content -LiteralPath $file -Raw)
    if (-not $configuration.ContainsKey('package') -or
        -not $configuration.ContainsKey('dependencies') -or
        -not $configuration.ContainsKey('settings')) {
        throw "Configuration must define package, dependencies, and settings maps: $file"
    }
    if ($configuration.package.id -ne (Split-Path -Leaf $root)) {
        throw "package.id must match the package folder name in '$file'."
    }
    if ($AsJson) {
        ConvertTo-Json -InputObject $configuration -Depth 20
    }
    else {
        return ,$configuration
    }
}
catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    throw
}
