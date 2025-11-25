$domain = "pysing"
$token = "74f24ec5-b68f-4219-a5e8-ffa8636749d7"

$uri = "https://www.duckdns.org/update?domains=$domain&token=$token&ip="

Invoke-WebRequest -Uri $uri -UseBasicParsing | Out-Null

Write-Output "$(Get-Date)  DuckDNS updated for pysing.duckdns.org"