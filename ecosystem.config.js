module.exports = {
  apps: [
    {
      name: 'smarthouse-backend',
      script: 'index.js',
      cwd: 'C:/Users/jerry/Desktop/SmartHouse2524/server',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: 'C:/Users/jerry/Desktop/SmartHouse2524/logs/backend-error.log',
      out_file: 'C:/Users/jerry/Desktop/SmartHouse2524/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'smarthouse-frontend',
      script: 'node_modules/react-scripts/scripts/start.js',
      cwd: 'C:/Users/jerry/Desktop/SmartHouse2524/client',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        BROWSER: 'none'
      },
      error_file: 'C:/Users/jerry/Desktop/SmartHouse2524/logs/frontend-error.log',
      out_file: 'C:/Users/jerry/Desktop/SmartHouse2524/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '30s'
    }
  ]
};
