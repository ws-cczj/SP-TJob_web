import type { Directive } from 'vue';
import { throttle } from 'lodash-es';
import store from '../../store';

let handleMouseMove: (e: MouseEvent) => void;
let handleMouseUp: () => void;

export const elDrawerDrag: Directive = {
  mounted(el: HTMLElement) {
    const drawerEle: HTMLElement = el.querySelector('.el-drawer') as HTMLElement;
    const dragItem: HTMLElement = document.createElement('div');
    dragItem.style.cssText = 'height: 100%;width: 5px;cursor: w-resize;position: absolute;left: 0;';
    drawerEle.appendChild(dragItem);

    let isDragging = false;
    let startX: number, startWidth: number;

    handleMouseMove = throttle((moveEvent: MouseEvent) => {
      if (!isDragging) return;

      requestAnimationFrame(() => {
        let realWidth: number = startWidth + (startX - moveEvent.pageX);
        const width30: number = document.body.clientWidth * 0.2;
        const width80: number = document.body.clientWidth * 0.8;
        realWidth = Math.min(Math.max(realWidth, width30), width80);
        drawerEle.style.width = `${realWidth}px`;
        store.data.setDrawerWidth(realWidth);
      });
    }, 16);

    handleMouseUp = () => {
      isDragging = false;
      document.body.style.userSelect = 'initial';
    };

    dragItem.onmousedown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX;
      startWidth = drawerEle.offsetWidth;
      document.body.style.userSelect = 'none';
    };

    // 绑定事件监听器
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  },
};