import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KSB White Glove Service',
    short_name: 'White Glove',
    description: 'Premium automotive service operations platform',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0d0d14',
    theme_color: '#0d0d14',
    icons: [
      {
        src: '/KSB_WhiteGlove.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
