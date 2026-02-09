import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  typescript: {
    // !! 警告 !!
    // 允许在项目有类型错误的情况下危险地完成生产构建。
    // !! 警告 !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
