/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      }
    ]
  },
  env:{
    OPENAI_API_KEY:'sk-BCCIX17Mb3OuyPpi85Ca471e9d9b4a6f9d5f22683b4cD277'
  }
}
