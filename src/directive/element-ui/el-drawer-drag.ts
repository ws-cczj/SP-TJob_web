import type { Directive } from 'vue';
import store from '../../store';

// 边界值
const width20: number = document.body.clientWidth * 0.2;
const width80: number = document.body.clientWidth * 0.8;
let handleMouseMove: (e: MouseEvent) => void;
let handleMouseUp: () => void;
let realWidth: number;

export const elDrawerDrag: Directive = {
  mounted(el: HTMLElement, binding) {
    const drawerEle: HTMLElement = el.querySelector('.el-drawer') as HTMLElement;
    const dragItem: HTMLElement = document.createElement('div');
    dragItem.style.cssText = 'height: 100%;width: 5px;cursor: w-resize;position: absolute;left: 0;';
    drawerEle.appendChild(dragItem);

    let isDragging = false;
    let startX: number, startWidth: number;
    handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging) return;
      requestAnimationFrame(() => {
        realWidth = startWidth + (startX - moveEvent.pageX);
        realWidth = Math.min(Math.max(realWidth, width20), width80);
        binding && binding.value(realWidth);
      });
    };

    handleMouseUp = () => {
      isDragging = false;
      store.data.setDrawerWidth(realWidth);
      document.body.style.userSelect = 'initial';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    dragItem.onmousedown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX;
      startWidth = drawerEle.offsetWidth;
      document.body.style.userSelect = 'none';
      // 绑定事件监听器
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  },
  unmounted() {
  }
};