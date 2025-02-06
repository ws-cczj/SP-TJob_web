import Vue from 'vue'

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $Elmessage: any;
        $router: any;
        $home: any;
    }
}