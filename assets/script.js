// ─── LOADER ───

window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("loader").classList.add("hidden");
    }, 2000);
});

// ─── ACTIVE NAV ───
const sections = document.querySelectorAll("section[id]");
const navAs = document.querySelectorAll(".nav-links a");
function updateNav() {
    let cur = "";
    sections.forEach((s) => {
        if (window.scrollY >= s.offsetTop - 120) cur = s.id;
    });
    navAs.forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + cur);
    });
}
window.addEventListener("scroll", updateNav);

// ─── REVEAL on SCROLL ───
const reveals = document.querySelectorAll(
    ".reveal,.reveal-left,.reveal-right",
);
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add("visible");
                // animate skill bars when visible
                e.target
                    .querySelectorAll(".skill-fill[data-w]")
                    .forEach((bar) => {
                        setTimeout(() => {
                            bar.style.width = bar.dataset.w + "%";
                        }, 200);
                    });
            }
        });
    },
    { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
);
reveals.forEach((el) => observer.observe(el));

// also trigger skill fills when parent card becomes visible
document.querySelectorAll(".skill-fill[data-w]").forEach((bar) => {
    const card = bar.closest(".reveal");
    if (!card) return;
    const cardObs = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                setTimeout(() => {
                    bar.style.width = bar.dataset.w + "%";
                }, 400);
                cardObs.disconnect();
            }
        },
        { threshold: 0.2 },
    );
    cardObs.observe(card);
});

// ─── TYPING EFFECT ───
const words = [
    "Full-stack Development",
    "Back-end Development",
    "Front-end Development",
];
let wi = 0,
    ci = 0,
    deleting = false;
const typEl = document.getElementById("typing-text");
function type() {
    if (!typEl) return;
    const word = words[wi];
    if (deleting) {
        typEl.textContent = word.substring(0, ci--);
        if (ci < 0) {
            deleting = false;
            wi = (wi + 1) % words.length;
            setTimeout(type, 400);
            return;
        }
        setTimeout(type, 60);
    } else {
        typEl.textContent = word.substring(0, ci++);
        if (ci > word.length) {
            deleting = true;
            setTimeout(type, 2000);
            return;
        }
        setTimeout(type, 90);
    }
}
if (typEl) setTimeout(type, 2200);

// ─── COUNTER ANIMATION ───
function animateCounter(el, target) {
    let current = 0;
    const step = Math.ceil(target / 50);
    const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + (el.dataset.target === "100" ? "%" : "+");
        if (current >= target) clearInterval(timer);
    }, 30);
}
const counterObs = new IntersectionObserver(
    (entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                document.querySelectorAll("[data-target]").forEach((el) => {
                    animateCounter(el, parseInt(el.dataset.target));
                });
                counterObs.disconnect();
            }
        });
    },
    { threshold: 0.5 },
);
const heroStats = document.querySelector(".hero-stats");
if (heroStats) counterObs.observe(heroStats);

// ─── LIVE PREVIEW MODAL ───
function openPreview(url, name) {
    const modal = document.getElementById("preview-modal");
    if (!modal) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
    }
    document.getElementById("modal-url").textContent = url;
    document.getElementById("modal-ext").href = url;
    const iframe = document.getElementById("modal-iframe");
    iframe.removeAttribute("srcdoc");
    iframe.src = url;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

const aguaMarkups = [
    {
        src: "assets/img/Agua_prototype (2).jpeg",
        alt: "Front view concept for the water level monitoring system",
        caption: "Front view concept",
    },
    {
        src: "assets/img/Agua_prototype (3).jpeg",
        alt: "Top view concept for the water level monitoring system",
        caption: "Top view concept",
    },
    {
        src: "assets/img/wiring frame.png",
        alt: "Arduino wiring diagram for the water level monitoring system",
        caption: "Arduino wiring diagram",
    },
];
let activeAguaMarkup = 0;

function showAguaMarkup(index) {
    activeAguaMarkup = (index + aguaMarkups.length) % aguaMarkups.length;
    const markup = aguaMarkups[activeAguaMarkup];
    const image = document.getElementById("agua-modal-image");
    if (!image) return;
    image.src = markup.src;
    image.alt = markup.alt;
    document.getElementById("agua-modal-caption").textContent = markup.caption;
    document.querySelectorAll(".agua-markup-thumb").forEach((thumb, thumbIndex) => {
        const isActive = thumbIndex === activeAguaMarkup;
        thumb.classList.toggle("active", isActive);
        thumb.setAttribute("aria-pressed", isActive.toString());
    });
}

function stepAguaMarkup(direction) {
    showAguaMarkup(activeAguaMarkup + direction);
}

function openAguaPreview() {
    const modal = document.getElementById("agua-modal");
    if (!modal) return;
    showAguaMarkup(0);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".agua-modal-close")?.focus();
}

function closeAguaPreview() {
    const modal = document.getElementById("agua-modal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function closePreview() {
    const iframe = document.getElementById("modal-iframe");
    const modal = document.getElementById("preview-modal");
    if (!iframe || !modal) return;
    modal.classList.remove("open");
    iframe.src = "";
    iframe.removeAttribute("srcdoc");
    document.body.style.overflow = "";
}

window.openPreview = openPreview;
if (typeof openAguaPreview === "function") window.openAguaPreview = openAguaPreview;
window.closeAguaPreview = closeAguaPreview;
window.showAguaMarkup = showAguaMarkup;
window.stepAguaMarkup = stepAguaMarkup;
window.closePreview = closePreview;

document
    .getElementById("preview-modal")
    ?.addEventListener("click", function (e) {
        if (e.target === this) closePreview();
    });
document.addEventListener("keydown", (e) => {
    const aguaModalOpen = document.getElementById("agua-modal")?.classList.contains("open");
    if (e.key === "Escape") {
        closePreview();
        closeAguaPreview();
    }
    if (!aguaModalOpen) return;
    if (e.key === "ArrowLeft") stepAguaMarkup(-1);
    if (e.key === "ArrowRight") stepAguaMarkup(1);
});

document
    .getElementById("agua-modal")
    ?.addEventListener("click", function (e) {
        if (e.target === this) closeAguaPreview();
    });

["wrap-fra", "wrap-dcc"].forEach((id) => {
    const fbId = "fb-" + id.replace("wrap-", "");
    const fb = document.getElementById(fbId);
    if (fb) {
        fb.classList.add("show");
    } 
});
function iframeLoaded(iframe, wrapId) {
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc && doc.body && doc.body.innerHTML.length > 100) {
            
            const fbId = "fb-" + wrapId.replace("wrap-", "");
            const fb = document.getElementById(fbId);
            if (fb) fb.classList.remove("show");
            iframe.style.display = "block";
        } else {
            throw new Error("empty");
        }
    } catch (e) {
        
        iframe.style.display = "none";
    }
}
function iframeError(wrapId) {
    const wrap = document.getElementById(wrapId);
    if (wrap) {
        const iframe = wrap.querySelector("iframe");
        if (iframe) iframe.style.display = "none";
    }
}

document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
        document
            .querySelectorAll(".filter-btn")
            .forEach((b) => {
                b.classList.remove("active");
                b.setAttribute("aria-pressed", "false");
            });
        this.classList.add("active");
        this.setAttribute("aria-pressed", "true");
        const filter = this.dataset.filter;
        document.querySelectorAll(".project-card").forEach((card) => {
            if (filter === "all" || card.dataset.cat === filter) {
                card.style.display = "";
                card.style.opacity = "0";
                card.style.transform = "translateY(16px)";
                setTimeout(() => {
                    card.style.transition = "opacity 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)";
                    card.style.opacity = "1";
                    card.style.transform = "";
                }, 50);
            } else {
                card.style.display = "none";
            }
        });
    });
});
