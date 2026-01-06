import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images:{
    remotePatterns:[
      {
        protocol:'https',
        hostname:'randomuser.me',
      },
    ],
  },
  experimental:{
    serverActions:{
      bodySizeLimit:'5mb'// default is 4mb
    }
  },
  productionBrowserSourceMaps: false
};

export default nextConfig;
