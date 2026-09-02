(() => {
  const canvas = document.getElementById("game-canvas"),
    ctx = canvas.getContext("2d"),
    minimap = document.getElementById("minimap"),
    minimapCtx = minimap.getContext("2d"),
    keys = new Set();
  const world = { w: 1800, h: 1100 },
    player = { x: 160, y: 500, speed: 250 },
    camera = { x: 0, y: 0 };
  const TERMINAL_TOTAL = 4;
  const skills = [
    ["JAVASCRIPT", 440, 260],
    ["PHP", 790, 190],
    ["PYTHON", 1140, 300],
    ["REACT", 1500, 220],
    ["MYSQL", 340, 810],
    ["SUPABASE", 920, 860],
    ["SECURITY", 1450, 790],
  ].map(([id, x, y]) => ({ id, x, y }));
  const terminals = [
    [
      "Fun Reading Adventure",
      630,
      530,
      "BOOK",
      "A gamified reading platform with adaptive activities, comprehension exercises, and progress tracking.",
      ["React", "Supabase", "Web Speech API"],
      "https://girk.vercel.app/",
    ],
    [
      "MAPSantos Construction",
      120,
      655,
      "SCHOOL",
      "An online construction management platform for tracking projects, budget, inventory, and employees.",
      ["React", "Vite", "Node.js", "MySQL"],
      "https://lightskyblue-skunk-361568.hostingersite.com",
    ],
    [
      "DepEd CabCy Connect",
      1120,
      555,
      "SCHOOL",
      "A digital platform for document tracking, HR services, asset management, and automated workflows.",
      ["PHP", "MySQL", "JavaScript"],
      "https://www.depedcabcyconnect.com/",
    ],
    [
      "Water Level Monitoring",
      650,
      920,
      "WATER",
      "An Arduino prototype with water-level sensing, indicator lights, buzzer warnings, and SMS alerts.",
      ["Arduino", "C++", "IoT"],
      "",
    ],
  ].map(([title, x, y, icon, copy, tags, url]) => ({
    title,
    x,
    y,
    icon,
    copy,
    tags,
    url,
  }));
  const portal = { x: 1630, y: 910 },
    blocks = [
      [180, 120, 190, 130],
      [880, 330, 210, 90],
      [1230, 690, 170, 100],
      [380, 580, 150, 100],
    ];
  const collected = new Set(),
    visited = new Set();
  let started = false,
    paused = false,
    near = null,
    previous = performance.now(),
    time = 0,
    toastTimer = 0;
  const $ = (id) => document.getElementById(id),
    dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function resize() {
    const r = devicePixelRatio || 1;
    canvas.width = innerWidth * r;
    canvas.height = innerHeight * r;
    ctx.setTransform(r, 0, 0, r, 0, 0);
  }
  function updateUI() {
    const unlocked = collected.size === 7;
    $("progress-fill").style.width =
      `${(collected.size / skills.length) * 100}%`;
    $("progress-text").textContent = `${collected.size} / 7 SKILLS RECOVERED`;
    $("skill-count").textContent = `${collected.size} / 7`;
    $("terminal-count").textContent = `${visited.size} / ${TERMINAL_TOTAL}`;
    $("portal-status").textContent = unlocked ? "READY" : "LOCKED";
    $("portal-icon").className = unlocked ? "fas fa-lock-open" : "fas fa-lock";
    $("skill-progress").setAttribute("aria-valuenow", String(collected.size));
  }
  function showSkillToast(skillId) {
    $("skill-toast-text").textContent = `${skillId} RECOVERED`;
    $("skill-toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("skill-toast").classList.remove("show"), 1800);
  }
  function openDialog(label, title, copy, tags, actions) {
    paused = true;
    keys.clear();
    $("dialog-label").textContent = label;
    $("dialog-title").textContent = title;
    $("dialog-copy").textContent = copy;
    $("dialog-tags").innerHTML = tags.map((t) => `<span>${t}</span>`).join("");
    $("dialog-actions").innerHTML =
      actions ||
      '<button data-close><i class="fas fa-arrow-left" aria-hidden="true"></i> RETURN TO MAP</button>';
    $("dialog").classList.remove("hidden");
    $("dialog-close").focus();
    $("dialog-actions")
      .querySelector("[data-close]")
      ?.addEventListener("click", closeDialog);
  }
  function closeDialog() {
    $("dialog").classList.add("hidden");
    paused = false;
  }
  function interact() {
    if (!near || paused) return;
    if (near.type === "terminal") {
      const t = near.item;
      visited.add(t.title);
      updateUI();
      openDialog(
        "PROJECT TERMINAL",
        t.title,
        t.copy,
        t.tags,
        `${t.url ? `<a href="${t.url}" target="_blank"><i class="fas fa-external-link-alt" aria-hidden="true"></i> OPEN PROJECT</a>` : ""}<button data-close><i class="fas fa-arrow-left" aria-hidden="true"></i> RETURN TO MAP</button>`,
      );
    } else if (collected.size === 7)
      openDialog(
        "MISSION COMPLETE",
        "Contact Portal Unlocked",
        "You recovered the full stack. Lloyd is available for custom web applications, dashboards, and internal systems.",
        ["Full-stack development", "Available for projects"],
        '<a href="mailto:lloydangelomartinez@gmail.com"><i class="fas fa-envelope" aria-hidden="true"></i> EMAIL LLOYD</a><a href="https://www.linkedin.com/in/angelo-martinez-563a171a2/" target="_blank"><i class="fab fa-linkedin-in" aria-hidden="true"></i> LINKEDIN</a><button data-close><i class="fas fa-map" aria-hidden="true"></i> KEEP EXPLORING</button>',
      );
  }
  function update(dt) {
    time += dt;
    if (!started || paused) return;
    let dx = 0,
      dy = 0;
    if (keys.has("a") || keys.has("arrowleft")) dx--;
    if (keys.has("d") || keys.has("arrowright")) dx++;
    if (keys.has("w") || keys.has("arrowup")) dy--;
    if (keys.has("s") || keys.has("arrowdown")) dy++;
    if (dx || dy) {
      const m = Math.hypot(dx, dy);
      dx /= m;
      dy /= m;
    }
    const n = {
      x: clamp(player.x + dx * player.speed * dt, 25, world.w - 25),
      y: clamp(player.y + dy * player.speed * dt, 25, world.h - 25),
    };
    if (
      !blocks.some(
        ([x, y, w, h]) =>
          n.x + 16 > x && n.x - 16 < x + w && n.y + 16 > y && n.y - 16 < y + h,
      )
    )
      Object.assign(player, n);
    skills.forEach((s) => {
      if (!collected.has(s.id) && dist(player, s) < 34) {
        collected.add(s.id);
        showSkillToast(s.id);
        updateUI();
      }
    });
    near = null;
    const t = terminals.find((t) => dist(player, t) < 65);
    if (t) near = { type: "terminal", item: t };
    else if (dist(player, portal) < 85) near = { type: "portal" };
    $("prompt").textContent = near
      ? near.type === "terminal"
        ? "[ E ] INSPECT PROJECT TERMINAL"
        : collected.size === 7
          ? "[ E ] ENTER CONTACT PORTAL"
          : "PORTAL LOCKED // COLLECT ALL SKILLS"
      : "";
    $("prompt").classList.toggle("show", !!near);
    camera.x +=
      (clamp(player.x - innerWidth / 2, 0, Math.max(0, world.w - innerWidth)) -
        camera.x) *
      0.08;
    camera.y +=
      (clamp(
        player.y - innerHeight / 2,
        0,
        Math.max(0, world.h - innerHeight),
      ) -
        camera.y) *
      0.08;
  }
  function text(s, x, y, c = "#6fcf97") {
    ctx.fillStyle = c;
    ctx.font = '700 10px "JetBrains Mono"';
    ctx.fillText(s, x, y);
  }
  function line(points) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  function terminalIcon(type, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#6fcf97";
    ctx.lineWidth = 2;
    if (type === "BOOK") {
      line([
        [-13, -7],
        [-2, -5],
        [-2, 9],
        [-13, 7],
        [-13, -7],
      ]);
      line([
        [2, -5],
        [13, -7],
        [13, 7],
        [2, 9],
        [2, -5],
      ]);
    } else if (type === "SCHOOL") {
      line([
        [-13, -5],
        [0, -13],
        [13, -5],
      ]);
      ctx.strokeRect(-11, -5, 22, 14);
      line([
        [-5, 9],
        [-5, 0],
        [5, 0],
        [5, 9],
      ]);
    } else if (type === "DOCS") {
      ctx.strokeRect(-9, -12, 15, 19);
      ctx.strokeRect(-4, -7, 15, 19);
      line([
        [0, -1],
        [7, -1],
      ]);
      line([
        [0, 4],
        [7, 4],
      ]);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.bezierCurveTo(15, 2, 12, 12, 0, 13);
      ctx.bezierCurveTo(-12, 12, -15, 2, 0, -14);
      ctx.stroke();
    }
    ctx.restore();
  }
  function bolt(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#6fcf97";
    ctx.beginPath();
    ctx.moveTo(2, -11);
    ctx.lineTo(-7, 2);
    ctx.lineTo(-1, 2);
    ctx.lineTo(-4, 11);
    ctx.lineTo(8, -3);
    ctx.lineTo(2, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function lock(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = collected.size === 7 ? "#6fcf97" : "#e05c3a";
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -2, 20, 16);
    ctx.beginPath();
    ctx.arc(0, -2, 7, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
  }
  function render() {
    // Fill entire canvas first — prevents the "cut" seam at map edges
    ctx.fillStyle = "#050a08";
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.fillStyle = "#050a08";
    ctx.fillRect(0, 0, world.w, world.h);
    ctx.strokeStyle = "rgba(31,111,95,0.10)";
    for (let x = 0; x < world.w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.h);
      ctx.stroke();
    }
    for (let y = 0; y < world.h; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(world.w, y);
      ctx.stroke();
    }
    blocks.forEach(([x, y, w, h]) => {
      ctx.fillStyle = "rgba(31,111,95,0.15)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(31,111,95,0.30)";
      ctx.strokeRect(x, y, w, h);
    });
    terminals.forEach((t) => {
      ctx.fillStyle = "rgba(47,160,132,0.12)";
      ctx.strokeStyle = "#2fa084";
      ctx.fillRect(t.x - 24, t.y - 22, 48, 44);
      ctx.strokeRect(t.x - 24, t.y - 22, 48, 44);
      terminalIcon(t.icon, t.x, t.y);
      text(t.title.toUpperCase(), t.x - 35, t.y + 40);
    });
    skills.forEach((s) => {
      if (collected.has(s.id)) return;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 16 + Math.sin(time * 4) * 3, 0, 7);
      ctx.fillStyle = "rgba(111,207,151,0.18)";
      ctx.fill();
      ctx.strokeStyle = "#6fcf97";
      ctx.stroke();
      bolt(s.x, s.y);
      text(s.id, s.x - 24, s.y + 35, "#6fcf97");
    });
    ctx.strokeStyle = collected.size === 7 ? "#6fcf97" : "rgba(224,92,58,0.5)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, 30 + i * 12, time, Math.PI * 1.5 + time);
      ctx.stroke();
    }
    lock(portal.x, portal.y);
    text(
      collected.size === 7
        ? "[ OPEN ] CONTACT PORTAL"
        : "[ LOCK ] CONTACT PORTAL",
      portal.x - 80,
      portal.y + 80,
      collected.size === 7 ? "#6fcf97" : "#e05c3a",
    );
    ctx.fillStyle = "#2fa084";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 18);
    ctx.lineTo(player.x + 15, player.y + 14);
    ctx.lineTo(player.x, player.y + 8);
    ctx.lineTo(player.x - 15, player.y + 14);
    ctx.fill();
    text("PLAYER_01", player.x - 29, player.y + 32);
    ctx.restore();
    renderMinimap();
  }
  function renderMinimap() {
    const w = minimap.width,
      h = minimap.height,
      sx = w / world.w,
      sy = h / world.h;
    minimapCtx.fillStyle = "#050a08";
    minimapCtx.fillRect(0, 0, w, h);
    minimapCtx.strokeStyle = "rgba(31,111,95,0.18)";
    for (let x = 0; x < w; x += 12) {
      minimapCtx.beginPath();
      minimapCtx.moveTo(x, 0);
      minimapCtx.lineTo(x, h);
      minimapCtx.stroke();
    }
    for (let y = 0; y < h; y += 12) {
      minimapCtx.beginPath();
      minimapCtx.moveTo(0, y);
      minimapCtx.lineTo(w, y);
      minimapCtx.stroke();
    }
    blocks.forEach(([x, y, bw, bh]) => {
      minimapCtx.fillStyle = "rgba(31,111,95,0.28)";
      minimapCtx.fillRect(x * sx, y * sy, bw * sx, bh * sy);
    });
    terminals.forEach((t) => {
      minimapCtx.fillStyle = visited.has(t.title)
        ? "rgba(111,207,151,0.85)"
        : "rgba(47,160,132,0.55)";
      minimapCtx.fillRect(t.x * sx - 2, t.y * sy - 2, 4, 4);
    });
    skills.forEach((s) => {
      if (collected.has(s.id)) return;
      minimapCtx.fillStyle = "#6fcf97";
      minimapCtx.beginPath();
      minimapCtx.arc(s.x * sx, s.y * sy, 2.5, 0, 7);
      minimapCtx.fill();
    });
    minimapCtx.strokeStyle = collected.size === 7 ? "#6fcf97" : "#e05c3a";
    minimapCtx.lineWidth = 1.5;
    minimapCtx.beginPath();
    minimapCtx.arc(portal.x * sx, portal.y * sy, 4, 0, 7);
    minimapCtx.stroke();
    minimapCtx.fillStyle = "#2fa084";
    minimapCtx.beginPath();
    minimapCtx.moveTo(player.x * sx, player.y * sy - 3);
    minimapCtx.lineTo(player.x * sx + 3, player.y * sy + 2);
    minimapCtx.lineTo(player.x * sx - 3, player.y * sy + 2);
    minimapCtx.closePath();
    minimapCtx.fill();
    const vx = (camera.x + innerWidth / 2) * sx,
      vy = (camera.y + innerHeight / 2) * sy,
      vw = innerWidth * sx,
      vh = innerHeight * sy;
    minimapCtx.strokeStyle = "rgba(111,207,151,0.45)";
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(vx - vw / 2, vy - vh / 2, vw, vh);
  }
  function loop(now) {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  function bindTouch(button) {
    const key = button.dataset.key;
    const press = (e) => {
      e.preventDefault();
      keys.add(key);
      button.classList.add("active");
    };
    const release = (e) => {
      e.preventDefault();
      keys.delete(key);
      button.classList.remove("active");
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
  }
  addEventListener("resize", resize);
  addEventListener("keydown", (e) => {
    if (e.repeat) return;
    keys.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === "e") interact();
    if (e.key === "Escape") closeDialog();
  });
  addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  document.querySelectorAll("[data-key]").forEach(bindTouch);
  $("touch-interact").onclick = interact;
  $("start-button").onclick = () => {
    started = true;
    $("start-screen").classList.add("hidden");
    canvas.focus();
  };
  $("dialog-close").onclick = closeDialog;
  resize();
  updateUI();
  requestAnimationFrame(loop);
})();
