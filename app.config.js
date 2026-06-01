const pkg = require('./package.json');

module.exports = {
  expo: {
    name: 'Today',
    slug: 'Today',
    version: pkg.version,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'today',
    userInterfaceStyle: 'automatic',
    android: {
      permissions: ['com.android.alarm.permission.SET_ALARM'],
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundColor: '#F1EFE8',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.skullhood.Today',
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#F1EFE8',
          android: {
            image: './assets/images/splash-icon.png',
            imageWidth: 76,
          },
        },
      ],
      'expo-sharing',
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '829e0f7f-37fd-4baa-ad1f-3cad3da94a70',
      },
    },
    owner: 'skullhood',
  },
};
