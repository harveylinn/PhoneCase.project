$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Push-Location (Join-Path $projectRoot 'frontend')
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw '前端建置失敗。' }
    & .\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.app.json
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript 檢查失敗。' }
} finally { Pop-Location }
Push-Location (Join-Path $projectRoot 'backend')
try {
    & .\mvnw.cmd '-Dtest=MemberApiTest' test
    if ($LASTEXITCODE -ne 0) { throw '會員測試失敗。' }
    $report = [xml](Get-Content 'target\surefire-reports\TEST-com.phonecase.backend.member.MemberApiTest.xml' -Raw)
    $testClasspath = ($report.testsuite.properties.property | Where-Object name -eq 'java.class.path').value
    if (-not $testClasspath) { throw '找不到測試 classpath。' }
    $distPath = (Join-Path $projectRoot 'frontend\dist').Replace('\', '/')
    @('-cp', ('"' + $testClasspath.Replace('\', '/') + '"'), 'com.phonecase.backend.member.MemberBrowserServer', ('"' + $distPath + '"')) |
        Set-Content 'target\member-browser.args' -Encoding utf8NoBOM
    Write-Host '開啟 http://127.0.0.1:18080/register；資料只存在記憶體，Ctrl+C 停止。'
    & java '@target/member-browser.args'
} finally { Pop-Location }
