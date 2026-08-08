import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino-pretty', 'thread-stream'],
  reactStrictMode: true,
  // swcMinify удалён — в Next.js 15+ минификация включена по умолчанию

  // Вариант А: Turbopack (рекомендуется, дефолт в Next.js 16)
  turbopack: {
    // Turbopack сам разбивает чанки — ручная настройка splitChunks не нужна.
    // Если понадобятся кастомные resolve aliases или loaders — добавь здесь.
  },

  // Вариант Б (альтернатива): если хочешь остаться на webpack — запускай с флагом
  // `next dev --webpack` и верни webpack-блок ниже вместо turbopack выше.
  //
  // webpack: (config, { isServer }) => {
  //   config.optimization.usedExports = true;
  //   if (!isServer) {
  //     config.optimization.splitChunks = { ... };
  //   }
  //   return config;
  // },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i.pinimg.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  allowedDevOrigins: ['shaxxxs.ddns.net', 'localhost'],
};

export default nextConfig;