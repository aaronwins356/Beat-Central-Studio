# Start Node multi-site server
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "C:\selfhost\server\server.js"

Start-Sleep -Seconds 2

# Start Caddy HTTPS / reverse proxy
Start-Process -NoNewWindow -FilePath "C:\selfhost\Caddy\caddy.exe" -ArgumentList "run","--config","C:\selfhost\Caddy\Caddyfile"