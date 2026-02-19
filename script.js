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

const contactForm = document.querySelector('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(contactForm);
    const name = data.get('name') || '';
    const business = data.get('business') || '';
    const quantity = data.get('quantity') || '___';
    const message = data.get('message') || '';
    const text = `I want to customize.\nName: ${name}\nBusiness: ${business}\nI need ${quantity} quantity.\nMessage: ${message}`;
    window.open(`https://wa.me/917503315833?text=${encodeURIComponent(text)}`, '_blank');
  });
}

const bg = document.querySelector('.animated-bg');
if (bg) {
  for (let i = 0; i < 14; i += 1) {
    const bubble = document.createElement('span');
    bubble.className = 'bubble';
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.animationDelay = `${Math.random() * 8}s`;
    bubble.style.animationDuration = `${8 + Math.random() * 10}s`;
    bubble.style.width = `${8 + Math.random() * 18}px`;
    bubble.style.height = bubble.style.width;
    bg.appendChild(bubble);
  }
}

const tiltCards = document.querySelectorAll('[data-tilt]');
tiltCards.forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-2px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const target = Number(entry.target.dataset.count || 0);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      entry.target.textContent = `${current}${target === 100 ? '%' : target === 24 ? 'x7' : '+'}`;
    }, 30);
    counterObserver.unobserve(entry.target);
  });
}, { threshold: 0.4 });
counters.forEach((counter) => counterObserver.observe(counter));

const testimonials = document.querySelectorAll('.testimonial-card');
if (testimonials.length > 1) {
  let active = 0;
  setInterval(() => {
    testimonials[active].classList.remove('active');
    active = (active + 1) % testimonials.length;
    testimonials[active].classList.add('active');
  }, 3200);
}

const cursorGlow = document.createElement('div');
cursorGlow.className = 'cursor-glow';
document.body.appendChild(cursorGlow);
window.addEventListener('mousemove', (e) => {
  cursorGlow.style.left = `${e.clientX}px`;
  cursorGlow.style.top = `${e.clientY}px`;
});
