const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function activateTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });

  panels.forEach((panel) => {
    const selected = panel.id === `${tab.dataset.tab}-panel`;
    panel.hidden = !selected;
    panel.classList.toggle('active', selected);
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + direction + tabs.length) % tabs.length];
    activateTab(next);
    next.focus();
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 },
);
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

async function loadGitHubStats() {
  const fallback = { repos: 3, stars: 0, followers: 1, following: 4 };
  try {
    const [userResponse, reposResponse] = await Promise.all([
      fetch('https://api.github.com/users/ZedritG'),
      fetch('https://api.github.com/users/ZedritG/repos?per_page=100&sort=updated'),
    ]);
    if (!userResponse.ok || !reposResponse.ok) throw new Error('GitHub API unavailable');
    const user = await userResponse.json();
    const repos = await reposResponse.json();
    const values = {
      repos: user.public_repos,
      stars: repos.reduce((total, repo) => total + repo.stargazers_count, 0),
      followers: user.followers,
      following: user.following,
    };
    Object.entries(values).forEach(([key, value]) => {
      const element = document.querySelector(`[data-stat="${key}"]`);
      if (element) element.textContent = new Intl.NumberFormat('en').format(value);
    });
  } catch {
    Object.entries(fallback).forEach(([key, value]) => {
      const element = document.querySelector(`[data-stat="${key}"]`);
      if (element) element.textContent = value;
    });
  }
}
loadGitHubStats();

const snake = document.querySelector('#snake-picture img');
if (snake) {
  snake.addEventListener('error', () => {
    document.querySelector('#snake-picture').hidden = true;
    document.querySelector('.snake-fallback').hidden = false;
  });
}

if (!prefersReducedMotion) {
  const card = document.querySelector('.profile-card');
  card.addEventListener('pointermove', (event) => {
    if (window.innerWidth < 901) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1100px) rotateY(${x * 4}deg) rotateX(${y * -4}deg)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });

  const canvas = document.querySelector('#particles');
  const context = canvas.getContext('2d');
  let particles = [];
  let animationFrame;

  function resizeCanvas() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * scale);
    canvas.height = Math.floor(window.innerHeight * scale);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.min(65, Math.floor(window.innerWidth / 18));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.25 + 0.25,
      speed: Math.random() * 0.16 + 0.04,
      alpha: Math.random() * 0.45 + 0.12,
    }));
  }

  function drawParticles() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((particle) => {
      particle.y -= particle.speed;
      if (particle.y < -4) particle.y = window.innerHeight + 4;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(196,181,253,${particle.alpha})`;
      context.fill();
    });
    animationFrame = requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  drawParticles();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
}
