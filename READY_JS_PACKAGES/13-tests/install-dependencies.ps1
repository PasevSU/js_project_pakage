$installer = Join-Path (Split-Path $PSScriptRoot -Parent) 'Install-PackageDependencies.ps1'
& powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $installer -PackagePath $PSScriptRoot
exit $LASTEXITCODE
