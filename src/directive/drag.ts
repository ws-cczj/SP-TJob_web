// dragDirective.ts  
export default {
  mounted(el: HTMLDivElement) {
    let isDragging = false;
    let startX:number, startY:number, initialX = 0, initialY = 0;
 
    const startDrag = (e:MouseEvent) => {
      isDragging = true;
      startX = e.clientX; 
      startY = e.clientY; 
      initialX = el.offsetLeft; 
      initialY = el.offsetTop; 
      console.log('触发')
      document.addEventListener('mousemove',  drag);
      document.addEventListener('mouseup',  endDrag);
    };
 
    const drag = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX  - startX;
      const deltaY = e.clientY  - startY;
      
      el.style.left  = initialX + deltaX + 'px';
      el.style.top  = initialY + deltaY + 'px';
    };
 
    const endDrag = () => {
      isDragging = false;
      document.removeEventListener('mousemove',  drag);
      document.removeEventListener('mouseup',  endDrag);
    };
 
    el.addEventListener('mousedown',  startDrag);
  }
};