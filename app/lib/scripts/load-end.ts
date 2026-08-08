// scripts/load-env.ts
import path from 'path';
import { config } from 'dotenv';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ Файл .env не найден по пути:', envPath);
  process.exit(1);
}

const result = config({ path: envPath });
if (result.error) {
  console.error('❌ Ошибка загрузки .env:', result.error);
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('❌ Переменная MONGODB_URI не найдена в .env');
  process.exit(1);
}

console.log('✅ .env загружен, MONGODB_URI найден');