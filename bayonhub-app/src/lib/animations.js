import gsap from "gsap"

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function pageEnter(containerRef) {
  const container = containerRef.current
  if (!container) return null
  if (prefersReducedMotion) {
    gsap.set(container, { opacity: 1, y: 0 })
    return null
  }
  return gsap.fromTo(
    container.children,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: "power2.out" },
  )
}

export function cardHover(cardRef) {
  if (prefersReducedMotion) return () => {}
  const card = cardRef.current
  if (!card) return () => {}
  const enter = () => {
    gsap.to(card, {
      y: -6,
      boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
      duration: 0.25,
      ease: "power2.out",
    })
  }
  const leave = () => {
    gsap.to(card, {
      y: 0,
      boxShadow: "0 1px 2px rgba(10, 10, 10, 0.04)",
      duration: 0.25,
      ease: "power2.out",
    })
  }
  card.addEventListener("mouseenter", enter)
  card.addEventListener("mouseleave", leave)
  return () => {
    card.removeEventListener("mouseenter", enter)
    card.removeEventListener("mouseleave", leave)
  }
}

export function modalEnter(panelRef) {
  if (!panelRef.current) return null
  if (prefersReducedMotion) {
    gsap.set(panelRef.current, { scale: 1, opacity: 1 })
    return null
  }
  return gsap.fromTo(
    panelRef.current,
    { scale: 0.95, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.25, ease: "power2.out" },
  )
}

export function counterUp(el, targetValue) {
  if (!el) return () => {}
  if (prefersReducedMotion) {
    el.textContent = targetValue
    return () => {}
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    const state = { value: 0 }
    gsap.to(state, {
      value: Number(targetValue || 0),
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = Math.round(state.value).toLocaleString()
      },
    })
    observer.disconnect()
  })
  observer.observe(el)
  return () => observer.disconnect()
}

export function heroParallax(target) {
  if (prefersReducedMotion) return () => {}
  if (!target) return () => {}
  const onScroll = () => {
    gsap.to(target, {
      y: window.scrollY * 0.08,
      duration: 0.3,
      overwrite: true,
      ease: "power1.out",
    })
  }
  window.addEventListener("scroll", onScroll, { passive: true })
  return () => window.removeEventListener("scroll", onScroll)
}
