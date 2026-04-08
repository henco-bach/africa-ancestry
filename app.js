const shell = document.querySelector("[data-parallax]");
const nav = document.querySelector(".site-nav");
const menuToggle = document.querySelector(".menu-toggle");
const embersLayer = document.querySelector(".embers");
const revealNodes = document.querySelectorAll(".reveal");
const howSection = document.querySelector("[data-how-section]");
const timelineFill = document.querySelector("[data-timeline-fill]");
const timelineSteps = document.querySelectorAll("[data-timeline-step]");
const footerYearNode = document.querySelector("[data-year]");

const createEmbers = (count = 18) => {
  if (!embersLayer) return;

  for (let i = 0; i < count; i += 1) {
    const ember = document.createElement("span");
    ember.className = "ember";

    const left = Math.random() * 100;
    const top = 40 + Math.random() * 58;
    const delay = Math.random() * 8;
    const duration = 7 + Math.random() * 9;
    const size = 2 + Math.random() * 5;

    ember.style.left = `${left}%`;
    ember.style.top = `${top}%`;
    ember.style.animationDelay = `${delay}s`;
    ember.style.animationDuration = `${duration}s`;
    ember.style.setProperty("--size", `${size}px`);

    embersLayer.appendChild(ember);
  }
};

const setupParallax = () => {
  if (
    !shell ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 900px)").matches
  ) {
    return;
  }

  let rafId = null;

  const update = (x, y) => {
    const maxShift = 11;
    const shiftX = ((x / window.innerWidth) * 2 - 1) * maxShift;
    const shiftY = ((y / window.innerHeight) * 2 - 1) * maxShift;

    shell.style.setProperty("--parallax-x", `${-shiftX * 0.5}px`);
    shell.style.setProperty("--parallax-y", `${-shiftY * 0.5}px`);
    shell.style.setProperty("--parallax-content", `${shiftY * -0.2}px`);
  };

  shell.addEventListener("pointermove", (event) => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      update(event.clientX, event.clientY);
    });
  });

  shell.addEventListener("pointerleave", () => {
    shell.style.setProperty("--parallax-x", "0px");
    shell.style.setProperty("--parallax-y", "0px");
    shell.style.setProperty("--parallax-content", "0px");
  });
};

const setupReveal = () => {
  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealNodes.forEach((node, index) => {
    node.style.transitionDelay = `${index * 120}ms`;
    observer.observe(node);
  });
};

const setupMenu = () => {
  if (!menuToggle || !nav) return;

  const closeMenu = () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.addEventListener("click", () => {
    const opening = !nav.classList.contains("open");

    nav.classList.toggle("open", opening);
    menuToggle.setAttribute("aria-expanded", opening ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });
};

const setupTimeline = () => {
  if (!howSection || !timelineFill || timelineSteps.length === 0) return;

  let ticking = false;

  const updateTimeline = () => {
    const rect = howSection.getBoundingClientRect();
    const start = window.innerHeight * 0.78;
    const end = window.innerHeight * 0.24;
    const total = rect.height + (start - end);
    const progress = Math.max(0, Math.min(1, (start - rect.top) / total));

    howSection.style.setProperty("--timeline-progress", progress.toFixed(3));

    const activeLine = window.innerHeight * 0.56;
    timelineSteps.forEach((step) => {
      const stepRect = step.getBoundingClientRect();
      const midpoint = stepRect.top + stepRect.height * 0.5;
      step.classList.toggle("active", midpoint <= activeLine);
    });

    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateTimeline);
  };

  updateTimeline();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
};

const setupFooterYear = () => {
  if (!footerYearNode) return;
  footerYearNode.textContent = new Date().getFullYear().toString();
};

createEmbers();
setupParallax();
setupReveal();
setupMenu();
setupTimeline();
setupFooterYear();
