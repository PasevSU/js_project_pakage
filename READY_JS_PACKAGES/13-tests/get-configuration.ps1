$ErrorActionPreference = 'Stop'
$loader = Join-Path (Split-Path $PSScriptRoot -Parent) 'Get-PackageConfiguration.ps1'
& $loader -PackagePath $PSScriptRoot -AsJson
