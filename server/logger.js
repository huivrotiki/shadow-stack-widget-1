import winston from 'winston';

const transports = [];

// File transports only in non-serverless environments
if (process.env.VERCEL !== '1') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  );
}

// Console transport always (Vercel captures stdout)
transports.push(new winston.transports.Console({
  format: winston.format.simple(),
}));

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'shadow-stack-orchestrator' },
  transports,
});

export default logger;
