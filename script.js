const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = Number(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);
reveals.forEach((el) => observer.observe(el));

const toggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

const transition = document.querySelector('.page-transition');
document.querySelectorAll('a[href$=".html"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    if (link.target === '_blank') return;
    const url = link.getAttribute('href');
    if (!url || url.startsWith('#')) return;
    e.preventDefault();
    transition?.classList.add('active');
    setTimeout(() => (window.location.href = url), 230);
  });
});

const parallaxElements = document.querySelectorAll('[data-parallax]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  parallaxElements.forEach((el) => {
    const speed = Number(el.dataset.parallax || 0.05);
    el.style.transform = `translateY(${y * speed}px)`;
  });
});
