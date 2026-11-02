$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1') -ErrorAction Stop
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $javaCandidates = @(
        (Get-ChildItem 'C:\Program Files\Eclipse Adoptium\jdk-21*' -Directory -ErrorAction SilentlyContinue),
        (Get-ChildItem '.tools\jdk-21*' -Directory -ErrorAction SilentlyContinue)
    ) | ForEach-Object { $_ }
    if ($javaCandidates.Count) { $env:JAVA_HOME = $javaCandidates[0].FullName }
    if (-not $env:JAVA_HOME) { throw 'Install JDK 21 and set JAVA_HOME first.' }
    $keyTool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
    $signingDirectory = Join-Path $env:USERPROFILE '.android\microledger-signing'
    $keyStorePath = Join-Path $signingDirectory 'microledger-release.p12'
    $passwordPath = Join-Path $signingDirectory 'password.clixml'
    if ((Test-Path -LiteralPath $keyStorePath) -and (Test-Path -LiteralPath $passwordPath)) {
        Write-Output 'Existing release signing files preserved. No new key created.'
        exit 0
    }
    if ((Test-Path -LiteralPath $keyStorePath) -or (Test-Path -LiteralPath $passwordPath)) {
        throw 'Partial signing setup found. Recover the existing key/password before continuing; no files were overwritten.'
    }
    New-Item -ItemType Directory -Force -Path $signingDirectory | Out-Null
    $bytes = New-Object byte[] 32
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($bytes) } finally { $random.Dispose() }
    $password = [Convert]::ToBase64String($bytes)
    $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
    $securePassword | Export-Clixml -LiteralPath $passwordPath
    $env:MICROLEDGER_STORE_PASSWORD = $password
    & $keyTool -genkeypair -noprompt -keystore $keyStorePath -storetype PKCS12 -alias microledger -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=MicroLedger, OU=Android, O=MicroLedger' -storepass:env MICROLEDGER_STORE_PASSWORD -keypass:env MICROLEDGER_STORE_PASSWORD
    if ($LASTEXITCODE) { throw 'Signing key generation failed. Preserve any signing files for recovery.' }
    Write-Output "Release signing key created outside Git: $keyStorePath"
    Write-Output 'The password file is encrypted with Windows DPAPI for this Windows user. Preserve both files and make a separate encrypted key/password backup before distributing future releases.'
} finally {
    Remove-Item Env:MICROLEDGER_STORE_PASSWORD -ErrorAction SilentlyContinue
    Pop-Location
}
