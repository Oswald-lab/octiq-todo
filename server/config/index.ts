export const config = {
  port: parseInt(process.env['PORT'] || '4001', 10),
  databaseUrl: process.env['DATABASE_URL'] || './data/app.db',
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:5173',
};
