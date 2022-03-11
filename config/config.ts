// https://umijs.org/config/
import { defineConfig } from 'umi';
import defaultSettings from './defaultSettings';
import proxy from './proxy';

const { REACT_APP_ENV } = process.env;

export default defineConfig({
  hash: true,
  antd: {},
  dva: {
    hmr: true,
  },
  locale: {
    // default zh-CN
    default: 'zh-CN',
    // default true, when it is true, will use `navigator.language` overwrite default
    antd: true,
    baseNavigator: true,
  },
  dynamicImport: {
    loading: '@/components/PageLoading/index',
  },
  targets: {
    ie: 11,
  },
  history: {
    type: 'hash',
  },
  base: './',
  publicPath: './',
  // umi routes: https://umijs.org/docs/routing
  routes: [
    {
      path: '/',
      component: '../layouts/BasicLayout',
      routes: [
        {
          path: '/',
          redirect: '/diskscan',
        },
        {
          path: '/diskscan',
          name: '1. Diskscan',
          component: './Diskscan/Diskscan.tsx',
          icon: 'download'
        },
        {
          path: '/serialno',
          name: '2. SerialNo',
          component: './SerialNo/SerialNo.tsx',
          icon: 'aim'
        },
        {
          path: '/movieimport',
          name: '3. Movie Import',
          component: './MovieManager/MovieImport.tsx',
          icon: 'cloud-download'
        },
        {
          path: '/prefixcutter',
          name: 'PrefixCutter',
          component: './PrefixCutter/PrefixCutter.tsx',
        },
        // {
        //   path: '/welcome',
        //   name: 'welcome',
        //   icon: 'smile',
        //   component: './Welcome',
        // },
        {
          name: 'bus picker',
          icon: 'table',
          path: '/list',
          component: './JavbusPicker/picker_index',
        },
        {
          name: 'aver list',
          icon: 'woman',
          path: '/averlist',
          component: './IdolList/IdolList.tsx'
        },
        {
          component: './404',
        },
      ],
    },
    {
      component: './404',
    },
  ],
  // Theme for antd: https://ant.design/docs/react/customize-theme-cn
  theme: {
    // ...darkTheme,
    'primary-color': defaultSettings.primaryColor,
  },
  // @ts-ignore
  title: false,
  ignoreMomentLocale: true,
  proxy: proxy[REACT_APP_ENV || 'dev'],
  manifest: {
    basePath: '/',
  },
});
