param([ValidateSet('Debug', 'Release')][string]$BuildType = 'Debug')
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1') -ErrorAction Stop
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $sdkPath = $env:ANDROID_HOME
    if (-not $sdkPath) { $sdkPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
    if (-not (Test-Path (Join-Path $sdkPath 'platforms\android-36\android.jar'))) {
        throw 'Install Android SDK Platform 36 in Android Studio first.'
    }
    $javaCandidates = @(
        (Get-ChildItem 'C:\Program Files\Eclipse Adoptium\jdk-21*' -Directory -ErrorAction SilentlyContinue),
        (Get-ChildItem '.tools\jdk-21*' -Directory -ErrorAction SilentlyContinue)
    ) | ForEach-Object { $_ }
    if ($javaCandidates.Count) { $env:JAVA_HOME = $javaCandidates[0].FullName }
    if (-not $env:JAVA_HOME) { throw 'Install JDK 21 and set JAVA_HOME to its folder.' }
    $env:ANDROID_HOME = $sdkPath
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    # A missing socket directory makes Java's Windows wakeup pipe use TCP.
    # This process-only workaround avoids AF_UNIX failures under the desktop host.
    $env:JAVA_TOOL_OPTIONS = "$env:JAVA_TOOL_OPTIONS -Djdk.net.unixdomain.tmpdir=C:/nonexistent-microledger-sockets".Trim()
    $sdkProperty = 'sdk.dir=' + $sdkPath.Replace('\', '/').Replace(':', '\:')
    Set-Content -LiteralPath 'android\local.properties' -Value $sdkProperty -Encoding ascii -NoNewline
    if ($BuildType -eq 'Release') {
        if (-not $env:MICROLEDGER_KEYSTORE) {
            $signingDirectory = Join-Path $env:USERPROFILE '.android\microledger-signing'
            $env:MICROLEDGER_KEYSTORE = Join-Path $signingDirectory 'microledger-release.p12'
            $passwordPath = Join-Path $signingDirectory 'password.clixml'
            if (-not (Test-Path -LiteralPath $env:MICROLEDGER_KEYSTORE) -or -not (Test-Path -LiteralPath $passwordPath)) {
                throw 'Run npm run android:signing once to create the private release signing key.'
            }
            $securePassword = Import-Clixml -LiteralPath $passwordPath
            $signingCredential = [pscredential]::new('MicroLedger', $securePassword)
            $env:MICROLEDGER_STORE_PASSWORD = $signingCredential.GetNetworkCredential().Password
            $env:MICROLEDGER_KEY_PASSWORD = $env:MICROLEDGER_STORE_PASSWORD
            $env:MICROLEDGER_KEY_ALIAS = 'microledger'
        }
        npm test
        if ($LASTEXITCODE) { throw 'Regression tests failed.' }
    }
    npm run lint
    if ($LASTEXITCODE) { throw 'Type check failed.' }
    npm run build
    if ($LASTEXITCODE) { throw 'Web build failed.' }
    npx cap sync android
    if ($LASTEXITCODE) { throw 'Android sync failed.' }
    Push-Location android
    try {
        .\gradlew.bat ":app:assemble$BuildType" --console=plain
        if ($LASTEXITCODE) { throw 'Android build failed.' }
    } finally { Pop-Location }
    New-Item -ItemType Directory -Force outputs | Out-Null
    if ($BuildType -eq 'Release') {
        .\android\gradlew.bat -p android :app:lintRelease --console=plain --quiet
        if ($LASTEXITCODE) { throw 'Android release lint failed.' }
        $apkSource = 'android\app\build\outputs\apk\release\app-release.apk'
        $apkDestination = 'outputs\MicroLedger.apk'
    } else {
        $apkSource = 'android\app\build\outputs\apk\debug\app-debug.apk'
        $apkDestination = 'outputs\MicroLedger-test.apk'
    }
    Copy-Item -LiteralPath $apkSource -Destination $apkDestination -Force
    $signer = Join-Path $sdkPath 'build-tools\36.0.0\apksigner.bat'
    & $signer verify --verbose $apkDestination
    if ($LASTEXITCODE) { throw 'APK signature verification failed.' }
    $hashStream = [IO.File]::OpenRead((Join-Path $PWD $apkDestination))
    $hasher = [Security.Cryptography.SHA256]::Create()
    try { $apkHash = [BitConverter]::ToString($hasher.ComputeHash($hashStream)).Replace('-', '').ToLowerInvariant() }
    finally { $hasher.Dispose(); $hashStream.Dispose() }
    Set-Content -LiteralPath ($apkDestination + '.sha256') -Value ($apkHash + '  ' + (Split-Path -Leaf $apkDestination)) -Encoding ascii
    Write-Output "APK ready: $(Join-Path $PWD $apkDestination)"
 } finally {
    Remove-Item Env:MICROLEDGER_STORE_PASSWORD, Env:MICROLEDGER_KEY_PASSWORD -ErrorAction SilentlyContinue
    Pop-Location
}
