module.exports = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.externals = ['bufferutil', 'utf-8-validate']
      }
      return config
    },
  }