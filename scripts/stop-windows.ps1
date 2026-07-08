$ErrorActionPreference = "Stop"

$containerName = if ($env:PRELEGAL_CONTAINER_NAME) { $env:PRELEGAL_CONTAINER_NAME } else { "prelegal-v1" }

$existingContainer = docker ps -aq --filter "name=^/$containerName$"
if ($existingContainer) {
    docker rm -f $containerName | Out-Null
}
Write-Host "Prelegal container stopped."
