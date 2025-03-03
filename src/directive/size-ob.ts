import type { Directive } from 'vue';
const map = new WeakMap() // WeakMap不影响垃圾回收

const ob = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const handler = map.get(entry.target)
    console.log(handler)
    handler && handler({
      width: entry.borderBoxSize[0].inlineSize,
      height: entry.borderBoxSize[0].blockSize
    })
  }
})

export const sizeOb: Directive = {
  mounted(el: HTMLElement, binding) { 
    ob.observe(el)
    map.set(el, binding)
    console.log(binding)
  },
  unmounted(el: HTMLElement) {
    ob.unobserve(el)
    map.delete(el)
  }
}