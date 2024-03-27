export function debounce<T extends (...args: Parameters<T>) => void>(this: ThisParameterType<T>, fn: T, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    timer && clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
