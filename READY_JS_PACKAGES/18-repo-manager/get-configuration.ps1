[CmdletBinding()]
param(
    [switch] $AsJson
)

$configurationLoader = Join-Path (Split-Path $PSScriptRoot -Parent) 'Get-PackageConfiguration.ps1'
& $configurationLoader -PackagePath $PSScriptRoot -AsJson:$AsJson
exit $LASTEXITCODE
