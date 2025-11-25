module.exports = {
  apps: [
    {
      name: "selfhost-server",
      cwd: "C:\\selfhost\\server",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M"
    }
  ]
};