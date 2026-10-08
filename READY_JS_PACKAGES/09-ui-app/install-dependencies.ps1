$installer = Join-Path (Split-Path $PSScriptRoot -Parent) 'Install-PackageDependencies.ps1'
$result = & $installer -PackagePath $PSScriptRoot
exit $result
