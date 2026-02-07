/** @type {import('next').NextConfig} */
const nextConfig = {
  // woosgem DS 패키지 트랜스파일
  transpilePackages: [
    '@woosgem/ds-react',
    '@woosgem/ds-styles',
    '@woosgem/ds-icons',
    '@woosgem/ds-core',
  ],
};

module.exports = nextConfig;
