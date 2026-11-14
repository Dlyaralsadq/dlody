module.exports = {
  apps: [
    {
      name: "clinicpro",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/workspace/apps/clinic-system",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "file:../../packages/database/prisma/dev.db",
      },
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
