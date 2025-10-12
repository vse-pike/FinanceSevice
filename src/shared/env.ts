import 'dotenv/config';
import { z } from 'zod';

export const env = z
  .object({
    DATABASE_URL: z.url(),
    BOT_TOKEN: z.string().min(1),
    NODE_ENV: z.string().default('development'),
    OER_API_KEY: z.string(),
    CMC_API_KEY: z.string(),
  })
  .parse(process.env);
