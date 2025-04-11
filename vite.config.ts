import { defineConfig,loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  if (mode === 'development') {
    console.log('env: ', env);
  }
  const { VITE_APP_SERVER_PORT, VITE_APP_SERVER_TARGET} = env;
  return {
    server: {
      open: true,
      port: parseInt(VITE_APP_SERVER_PORT),
      proxy: {
        '/v1': {
          target: VITE_APP_SERVER_TARGET, // 本地后端地址
          changeOrigin: true, //允许跨域
          rewrite: (path) => path.replace(/^\/v1/, '/v1/api')
        }
      }
    },
    resolve: {
      alias: {
        '@':path.resolve(__dirname, 'src')
      },
      json: {
        imports: true
      }
    },
    plugins: [
      vue(),
      AutoImport({
      resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  }
})
