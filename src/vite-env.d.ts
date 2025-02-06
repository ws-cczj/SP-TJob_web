/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_PROJECT:string;//定义提示信息 数据是只读的无法被修改
  readonly VITE_APP_Title:string;
  readonly VITE_APP_SERVER_PORT: number;
  readonly VITE_APP_SERVER_MODE: string;
  readonly VITE_APP_SERVER_TARGET: string;
  readonly VITE_APP_GATEWAY_TIMEOUT: number;
  readonly VITE_APP_GATEWAY_BASEURL: string;
  readonly VITE_APP_GATEWAY_WITHCREDENTIALS: boolean;
  //多个变量定义多个...
}

declare module "*.vue" {
  import { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, any>
  export default component
}
