$ErrorActionPreference = "Stop"

$imageName = if ($env:PRELEGAL_IMAGE_NAME) { $env:PRELEGAL_IMAGE_NAME } else { "prelegal-v1" }
$containerName = if ($env:PRELEGAL_CONTAINER_NAME) { $env:PRELEGAL_CONTAINER_NAME } else { "prelegal-v1" }
$port = if ($env:PRELEGAL_PORT) { $env:PRELEGAL_PORT } else { "8000" }

docker build -t $imageName .
$existingContainer = docker ps -aq --filter "name=^/$containerName$"
if ($existingContainer) {
    docker rm -f $containerName | Out-Null
}
docker run -d --name $containerName -p "${port}:8000" $imageName

Write-Host "Prelegal is running at http://127.0.0.1:$port"
