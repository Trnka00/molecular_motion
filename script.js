const temperatureSlider = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperatureValue');
const numParticlesInput = document.getElementById('numParticles');
const particleSizeInput = document.getElementById('particleSize');
const particleShapeSelect = document.getElementById('particleShape');
const particleColorSelect = document.getElementById('particleColor');
const applySettingsButton = document.getElementById('applySettings');
const presetGasButton = document.getElementById('presetGas');
const presetLiquidButton = document.getElementById('presetLiquid');
const presetSolidButton = document.getElementById('presetSolid');
const presetButtons = [presetGasButton, presetLiquidButton, presetSolidButton];
const themeToggle = document.getElementById('themeToggle');
const toggleTrajectoryButton = document.getElementById('toggleTrajectory');
const clearTrajectoryButton = document.getElementById('clearTrajectory');

// Canvas a píst
const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const piston = document.getElementById('piston');
const pistonHeight = 30;

// Globální proměnné
let particles = [];
let numParticles = parseInt(numParticlesInput.value, 10);
let particleSize = parseInt(particleSizeInput.value, 10);
const gravity = 0.002; // Hardcoded gravity value
let particleShape = particleShapeSelect.value;
let particleColor = particleColorSelect.value;

// Proměnné pro trajektorii
let showTrajectory = false;
let selectedParticle = null;
let trajectoryPoints = [];

// Uchovávání pozic pístu
let pistonVisualY = 0;
let pistonSimY = 0;
let isDragging = false;

// Event listenery
particleShapeSelect.addEventListener('change', (e) => {
  particleShape = e.target.value;
});
particleColorSelect.addEventListener('change', function() {
  particleColor = this.value;
});
themeToggle.addEventListener('change', function(){
  if(this.checked){
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
});
toggleTrajectoryButton.addEventListener('click', () => {
  showTrajectory = !showTrajectory;
  toggleTrajectoryButton.textContent = showTrajectory ? "Skrýt trajektorii" : "Zobrazit trajektorii";
});
clearTrajectoryButton.addEventListener('click', () => {
  trajectoryPoints = [];
});

// Vytvoření částic
function createParticles() {
  particles = [];
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: particleSize,
      state: "solid",
      color: particleColor
    });
  }
  if (particles.length > 0) {
    selectedParticle = particles[0]; // Označíme první částici jako vybranou
  }
}

// Start simulace
function startSimulation() {
  createParticles();
  animate();
}

window.addEventListener('load', () => {
  // Umístíme píst na horní okraj canvasu
  pistonVisualY = 0;
  pistonSimY = 0;
  piston.style.top = "0px";
  
  // Update initial temperature display
  const inputValue = parseInt(temperatureSlider.value, 10);
  const displayValue = Math.round(-5 + (inputValue - 5) * (115 / 115));
  temperatureValue.textContent = `${displayValue} °C`;
  
  // Načtení poznámek z localStorage
  const note1 = localStorage.getItem('note1');
  if(note1) document.getElementById('noteText1').value = note1;
  const note2 = localStorage.getItem('note2');
  if(note2) document.getElementById('noteText2').value = note2;
  const note3 = localStorage.getItem('note3');
  if(note3) document.getElementById('noteText3').value = note3;
  
  // Načtení uložených karet (pokud existují)
  const storedTitle1 = localStorage.getItem('cardTitle1');
  if(storedTitle1) document.getElementById('cardTitle1').textContent = storedTitle1;
  const storedContent1 = localStorage.getItem('cardContent1');
  if(storedContent1) document.getElementById('cardContent1').innerHTML = storedContent1;

  const storedTitle2 = localStorage.getItem('cardTitle2');
  if(storedTitle2) document.getElementById('cardTitle2').textContent = storedTitle2;
  const storedContent2 = localStorage.getItem('cardContent2');
  if(storedContent2) document.getElementById('cardContent2').innerHTML = storedContent2;

  const storedTitle3 = localStorage.getItem('cardTitle3');
  if(storedTitle3) document.getElementById('cardTitle3').textContent = storedTitle3;
  const storedContent3 = localStorage.getItem('cardContent3');
  if(storedContent3) document.getElementById('cardContent3').innerHTML = storedContent3;
});

startSimulation();

temperatureSlider.addEventListener('input', (e) => {
  const inputValue = parseInt(e.target.value);
  // Map 5-120 to -5-110
  const displayValue = Math.round(-5 + (inputValue - 5) * (115 / 115));
  temperatureValue.textContent = `${displayValue} °C`;
});
applySettingsButton.addEventListener('click', () => {
  numParticles = parseInt(numParticlesInput.value, 10);
  particleSize = parseInt(particleSizeInput.value, 10);
  createParticles();
});
presetGasButton.addEventListener('click', () => { applyPreset('gas'); createParticles(); });
presetLiquidButton.addEventListener('click', () => { applyPreset('liquid'); createParticles(); });
presetSolidButton.addEventListener('click', () => { applyPreset('solid'); createParticles(); });

function applyPreset(preset) {
  presetButtons.forEach(button => button.classList.remove('active'));
  if (preset === 'gas') {
    numParticlesInput.value = 1500;
    particleSizeInput.value = 2;
    presetGasButton.classList.add('active');
  } else if (preset === 'liquid') {
    numParticlesInput.value = 220;
    particleSizeInput.value = 16;
    presetLiquidButton.classList.add('active');
  } else if (preset === 'solid') {
    numParticlesInput.value = 250;
    particleSizeInput.value = 16;
    presetSolidButton.classList.add('active');
  }
  numParticles = parseInt(numParticlesInput.value, 10);
  particleSize = parseInt(particleSizeInput.value, 10);
}

// Kolize
function handleCollisions() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let r1 = p1.radius;
      let r2 = p2.radius;
      if (particleShape === "h2o") {
        r1 *= 1.5;
        r2 *= 1.5;
      }
      const minDist = r1 + r2;
      if (dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;
        const p1VelN = p1.vx * nx + p1.vy * ny;
        const p2VelN = p2.vx * nx + p2.vy * ny;
        const p1VelNAfter = p2VelN;
        const p2VelNAfter = p1VelN;
        const diff1 = p1VelNAfter - p1VelN;
        const diff2 = p2VelNAfter - p2VelN;
        p1.vx += diff1 * nx;
        p1.vy += diff1 * ny;
        p2.vx += diff2 * nx;
        p2.vy += diff2 * ny;
        const overlap = (minDist - dist) / 2;
        p1.x -= overlap * nx;
        p1.y -= overlap * ny;
        p2.x += overlap * nx;
        p2.y += overlap * ny;
      }
    }
  }
}

// Update částic
function updateParticles() {
  const inputValue = parseInt(temperatureSlider.value, 10);
  // Map 5-120 to -5-110 for display
  const displayValue = Math.round(-5 + (inputValue - 5) * (115 / 115));
  
  // Map display temperature to actual simulation temperature (never below 50K)
  const simulationTemp = 50 + (displayValue + 5) * 2; // Maps -5°C to 50K, 110°C to 270K
  
  const restitution = (displayValue <= 80) ? 0.5 : 1;
  const maxTemp = 1000;
  const effectiveGravity = gravity;
  
  // Calculate speed multiplier based on simulation temperature
  let speedMultiplier;
  if (displayValue <= 10) {
    // Set a minimum speed multiplier for very low temperatures
    // This ensures particles continue to move even at 0°C or below
    speedMultiplier = Math.max(0.1, (displayValue / 50) * Math.pow(0.8, Math.max(0, 10 - displayValue)));
  } else if (displayValue <= 110) {
    speedMultiplier = displayValue / 50;  // Linear increase up to 110°C
  } else {
    // Exponential increase after 110°C
    const excessTemp = displayValue - 110;
    speedMultiplier = (270 / 50) * Math.pow(1.008, excessTemp);
  }
  
  particles.forEach(particle => {
    if (particle !== selectedParticle) {
      particle.color = particleColor;
    }
    // Use simulation temperature for state transitions
    if (simulationTemp <= 150) {  // Below 150K
      particle.state = "solid";
    } else if (simulationTemp <= 260) {  // Below 260K (matches 100°C display)
      particle.state = "liquid";
    } else {
      particle.state = "gas";
    }
    particle.vy += effectiveGravity * 0.5;
    particle.x += particle.vx * speedMultiplier;
    particle.y += particle.vy * speedMultiplier;
    if (particle.x - particle.radius < 0) {
      particle.x = particle.radius;
      particle.vx *= -1;
    }
    if (particle.x + particle.radius > canvas.width) {
      particle.x = canvas.width - particle.radius;
      particle.vx *= -1;
    }
    if (particle.y - particle.radius < pistonSimY + pistonHeight) {
      particle.y = pistonSimY + pistonHeight + particle.radius;
      particle.vy *= -restitution;
    }
    if (particle.y + particle.radius > canvas.height) {
      particle.y = canvas.height - particle.radius;
      particle.vy *= -restitution;
    }
  });

  if (showTrajectory && selectedParticle) {
    trajectoryPoints.push({ x: selectedParticle.x, y: selectedParticle.y });
    if (trajectoryPoints.length > 500) trajectoryPoints.shift();
  }

  handleCollisions();

  particles.forEach(p1 => {
    if (p1.state === "liquid" || p1.state === "solid") {  // Allow condensation for both liquid and solid states
      particles.forEach(p2 => {
        if (p1 !== p2 && (p2.state === "liquid" || p2.state === "solid")) {  // Allow interaction between liquid and solid particles
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 3 * p1.radius) { // pouze pokud jsou blízko
            // Simplified condensation based on display temperature
            // Always apply condensation when temperature is 100°C or below (displayed)
            const condensationStrength = (displayValue <= 100) ? 0.01 : 0;
            
            p1.vx += dx * condensationStrength;
            p1.vy += dy * condensationStrength;
          }
        }
      });
    }
  });
}

// Kreslení částic
function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (showTrajectory && trajectoryPoints.length > 1) {
    ctx.beginPath();
    ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);
    for (let i = 1; i < trajectoryPoints.length; i++) {
      ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
    }
    ctx.strokeStyle = "#FF00FF";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  particles.forEach(particle => {
    ctx.beginPath();
    if (particle === selectedParticle) {
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FF00FF";
    } else {
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
    }
    ctx.fill();
    ctx.closePath();

    if (particleShape === "h2o") {
      if (particle.angle === undefined) {
        particle.angle = Math.random() * Math.PI * 2;
      }
      particle.angle += 0.02;
      const d = particle.radius * 1.5;
      const angleOffset = 52.25 * Math.PI / 180;
      const leftAngle = particle.angle + angleOffset;
      const rightAngle = particle.angle - angleOffset;
      const hx1 = particle.x + d * Math.cos(leftAngle);
      const hy1 = particle.y + d * Math.sin(leftAngle);
      const hx2 = particle.x + d * Math.cos(rightAngle);
      const hy2 = particle.y + d * Math.sin(rightAngle);
      ctx.beginPath();
      ctx.arc(hx1, hy1, particle.radius / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#FF5733";
      ctx.fill();
      ctx.closePath();
      ctx.beginPath();
      ctx.arc(hx2, hy2, particle.radius / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#FF5733";
      ctx.fill();
      ctx.closePath();
    }
  });
}

function animate() {
  updateParticles();
  drawParticles();
  
  // Ensure piston visual position matches simulation position
  piston.style.top = pistonSimY + "px";
  
  requestAnimationFrame(animate);
}

// Manipulace s pístem myší
piston.addEventListener('mousedown', () => { isDragging = true; });
window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const containerRect = canvasContainer.getBoundingClientRect();
    const minY = 0;
    const maxY = canvas.height;
    let newTop = e.clientY - containerRect.top;
    if (newTop < minY) newTop = minY;
    if (newTop > maxY) newTop = maxY;
    pistonVisualY = newTop;
    piston.style.top = pistonVisualY + "px";
    pistonSimY = pistonVisualY;
  }
});

// manipulace pístem pomocí dotyku
piston.addEventListener('touchstart', () => {
  isDragging = true;
});

window.addEventListener('touchend', () => {
  isDragging = false;
});

window.addEventListener('touchmove', (e) => {
  if (isDragging) {
    const containerRect = canvasContainer.getBoundingClientRect();
    const touch = e.touches[0]; // první dotek
    const minY = 0;
    const maxY = canvas.height;

    let newTop = touch.clientY - containerRect.top;
    if (newTop < minY) newTop = minY;
    if (newTop > maxY) newTop = maxY;

    pistonVisualY = newTop;
    piston.style.top = pistonVisualY + "px";
    pistonSimY = pistonVisualY;

    e.preventDefault(); // Zabrání posouvání stránky
  }
}, { passive: false }); // Nutné pro preventDefault v některých prohlížečích

// Ensure piston positions are synchronized on window resize
window.addEventListener('resize', () => {
  pistonSimY = pistonVisualY;
});

animate();

// Ukládání a mazání poznámek (modály s teorií)
const saveNote1 = document.getElementById('saveNote1');
const clearNote1 = document.getElementById('clearNote1');
const saveNote2 = document.getElementById('saveNote2');
const clearNote2 = document.getElementById('clearNote2');
const saveNote3 = document.getElementById('saveNote3');
const clearNote3 = document.getElementById('clearNote3');

if (saveNote1 && document.getElementById('noteText1')) {
  saveNote1.addEventListener('click', () => {
    const text = document.getElementById('noteText1').value;
    localStorage.setItem('note1', text);
  });
}

if (clearNote1 && document.getElementById('noteText1')) {
  clearNote1.addEventListener('click', () => {
    document.getElementById('noteText1').value = "";
    localStorage.removeItem('note1');
  });
}

if (saveNote2 && document.getElementById('noteText2')) {
  saveNote2.addEventListener('click', () => {
    const text = document.getElementById('noteText2').value;
    localStorage.setItem('note2', text);
  });
}

if (clearNote2 && document.getElementById('noteText2')) {
  clearNote2.addEventListener('click', () => {
    document.getElementById('noteText2').value = "";
    localStorage.removeItem('note2');
  });
}

if (saveNote3 && document.getElementById('noteText3')) {
  saveNote3.addEventListener('click', () => {
    const text = document.getElementById('noteText3').value;
    localStorage.setItem('note3', text);
  });
}

if (clearNote3 && document.getElementById('noteText3')) {
  clearNote3.addEventListener('click', () => {
    document.getElementById('noteText3').value = "";
    localStorage.removeItem('note3');
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const note1 = localStorage.getItem('note1');
  if(note1) document.getElementById('noteText1').value = note1;
  const note2 = localStorage.getItem('note2');
  if(note2) document.getElementById('noteText2').value = note2;
  const note3 = localStorage.getItem('note3');
  if(note3) document.getElementById('noteText3').value = note3;
});

// Ukládání / mazání obsahu karet (edit modály)
document.addEventListener("DOMContentLoaded", function() {
  // Event listenery pro uložení obsahu karet

  const saveCard1 = document.getElementById('saveCard1')
  if (saveCard1) {
    saveCard1.addEventListener('click', function() {
      const title = document.getElementById('cardTitle1Input').value.trim();
      const content = document.getElementById('cardText1Input').value.trim();
      localStorage.setItem('cardTitle1', title);
      localStorage.setItem('cardContent1', content);

      // Odložíme aktualizaci DOMu o 200 ms – to umožní korektní zavření modálu

      setTimeout(() => {
        document.getElementById('cardTitle1').textContent = title;
        document.getElementById('cardContent1').innerHTML = `<p class="card-text">${content}</p>`;
        console.log("Karta 1 aktualizována:", title, content);
      }, 200);
  })
}
  
  const saveCard2 = document.getElementById('saveCard2')

  if (saveCard2) {
    saveCard2.addEventListener('click', function() {
      const title = document.getElementById('cardTitle2Input').value.trim();
      const content = document.getElementById('cardText2Input').value.trim();
      localStorage.setItem('cardTitle2', title);
      localStorage.setItem('cardContent2', content);
      setTimeout(() => {
        document.getElementById('cardTitle2').textContent = title;
        document.getElementById('cardContent2').innerHTML = `<p class="card-text">${content}</p>`;
        console.log("Karta 2 aktualizována:", title, content);
      }, 200);
  })
  
  }
  const saveCard3 = document.getElementById('saveCard3')
  
  if (saveCard3) {
    saveCard3.addEventListener('click', function() {
      const title = document.getElementById('cardTitle3Input').value.trim();
      const content = document.getElementById('cardText3Input').value.trim();
      localStorage.setItem('cardTitle3', title);
      localStorage.setItem('cardContent3', content);
      setTimeout(() => {
        document.getElementById('cardTitle3').textContent = title;
        document.getElementById('cardContent3').innerHTML = `<p class="card-text">${content}</p>`;
        console.log("Karta 3 aktualizována:", title, content);
      }, 200);
    })
  }
  
  
  // Při otevření modálních oken načteme aktuální obsah do formulářů

  function loadCardData(cardNumber) {
    const titleElem = document.getElementById(`cardTitle${cardNumber}`);
    const contentElem = document.getElementById(`cardContent${cardNumber}`);
    const titleInput = document.getElementById(`cardTitle${cardNumber}Input`);
    const textInput = document.getElementById(`cardText${cardNumber}Input`);
    if (titleElem && contentElem && titleInput && textInput) {
      titleInput.value = titleElem.textContent.trim();

      // Případně načtěte pouze obsah vnořeného <p> (pokud existuje)
      
      const pElem = contentElem.querySelector('.card-text');
      textInput.value = pElem ? pElem.innerHTML.trim() : contentElem.innerHTML.trim();
    }
  }
  
  const editCard1Btn = document.querySelector('[data-bs-target="#editCard1"]');
  if (editCard1Btn) {
    editCard1Btn.addEventListener('click', () => {
      loadCardData(1);
    });
  }
  const editCard2Btn = document.querySelector('[data-bs-target="#editCard2"]');
  if (editCard2Btn) {
    editCard2Btn.addEventListener('click', () => {
      loadCardData(2);
    });
  }
  const editCard3Btn = document.querySelector('[data-bs-target="#editCard3"]');
  if (editCard3Btn) {
    editCard3Btn.addEventListener('click', () => {
      loadCardData(3);
    });
  }
});