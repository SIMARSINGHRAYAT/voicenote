$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$desktop = Join-Path $root "desktop"
$out = Join-Path $desktop "out"
$publish = Join-Path $out "publish"
$package = Join-Path $out "package"
$assets = Join-Path $package "Assets"
$makeAppx = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin\10.0.26100.0\x64\makeappx.exe"
$signtool = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin\10.0.19041.0\x64\signtool.exe"

if (-not (Test-Path $makeAppx)) { throw "MakeAppx was not found at $makeAppx" }
if (-not (Test-Path $signtool)) { throw "SignTool was not found at $signtool" }

Remove-Item $out -Recurse -Force -ErrorAction SilentlyContinue
New-Item $assets -ItemType Directory -Force | Out-Null

dotnet publish (Join-Path $desktop "VoiceNoteDesktop.csproj") -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o $publish
Copy-Item (Join-Path $publish "*") $package -Recurse -Force
Copy-Item (Join-Path $desktop "Package.appxmanifest") (Join-Path $package "AppxManifest.xml")

Add-Type -AssemblyName System.Drawing
$source = [System.Drawing.Image]::FromFile((Join-Path $root "public\voice-notes-microphone-icon.png"))
foreach ($size in @(44, 150, "store")) {
    if ($size -eq "store") { $pixelSize = 50; $name = "StoreLogo.png" } else { $pixelSize = [int]$size; $name = "Square${size}x${size}Logo.png" }
    $bitmap = New-Object System.Drawing.Bitmap($pixelSize, $pixelSize)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.DrawImage($source, 0, 0, $pixelSize, $pixelSize)
    $bitmap.Save((Join-Path $assets $name), [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose(); $bitmap.Dispose()
}
$source.Dispose()

$msix = Join-Path $out "VoiceNote.msix"
& $makeAppx pack /d $package /p $msix /o
if ($LASTEXITCODE -ne 0) { throw "MakeAppx failed with exit code $LASTEXITCODE" }

$cert = Join-Path $out "VoiceNote.cer"
$existing = Get-ChildItem Cert:\CurrentUser\My | Where-Object Subject -eq "CN=SIMARSINGHRAYAT" | Select-Object -First 1
if (-not $existing) {
    $existing = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=SIMARSINGHRAYAT" -CertStoreLocation Cert:\CurrentUser\My -HashAlgorithm SHA256
}
Export-Certificate -Cert $existing -FilePath $cert | Out-Null
& $signtool sign /fd SHA256 /sha1 $existing.Thumbprint $msix
if ($LASTEXITCODE -ne 0) { throw "SignTool failed with exit code $LASTEXITCODE" }

Write-Host "Created signed MSIX: $msix"
Write-Host "Certificate for local installation: $cert"
