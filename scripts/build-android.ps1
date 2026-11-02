$ErrorActionPreference = 'Stop'
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
    npm run lint
    if ($LASTEXITCODE) { throw 'Type check failed.' }
    npm run build
    if ($LASTEXITCODE) { throw 'Web build failed.' }
    npx cap sync android
    if ($LASTEXITCODE) { throw 'Android sync failed.' }
    Push-Location android
    try {
        .\gradlew.bat assembleDebug --console=plain
        if ($LASTEXITCODE) { throw 'Android build failed.' }
    } finally { Pop-Location }
    New-Item -ItemType Directory -Force outputs | Out-Null
    Copy-Item -LiteralPath 'android\app\build\outputs\apk\debug\app-debug.apk' -Destination 'outputs\MicroLedger-test.apk' -Force
    Write-Output "APK ready: $(Join-Path $PWD 'outputs\MicroLedger-test.apk')"
} finally { Pop-Location }
