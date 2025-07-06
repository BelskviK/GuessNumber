const HOUSE_EDGE = 0.025;
let balance = 100;
let history = [];
let condition = null;
let sliderValue = 50;
let isAnimating = false;
let confettiCanvas, particleCanvas, confettiCtx, particleCtx;
let soundEnabled = true;

// Game statistics
let stats = {
  wins: 0,
  losses: 0,
  totalWagered: 0,
  biggestWin: 0,
  currentStreak: 0,
  maxStreak: 0,
};

// Audio context for fallback sounds
let audioContext;
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
  console.warn("Web Audio API not supported");
}

// Sound functions
function playTone(frequency, duration, type = "sine") {
  if (!soundEnabled || !audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

function playWinSound() {
  playTone(880, 0.5);
  setTimeout(() => playTone(1318.51, 0.5), 200);
}

function playLoseSound() {
  playTone(220, 1.5, "square");
}

function playClickSound() {
  playTone(523.25, 0.1);
}

function playSlideSound() {
  playTone(659.25, 0.05);
}

// Initialize canvases
function initCanvases() {
  confettiCanvas = document.getElementById("confetti-canvas");
  particleCanvas = document.getElementById("particle-canvas");

  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;

  confettiCtx = confettiCanvas.getContext("2d");
  particleCtx = particleCanvas.getContext("2d");
}

// Fireworks effect for wins
function triggerConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    spread: 60,
    ticks: 100,
    gravity: 1.5,
    decay: 0.94,
    startVelocity: 30,
    colors: ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981"],
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      angle: 60,
      scalar: 1.2,
    });
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      angle: 120,
      scalar: 1.2,
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.3,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

// Particle effect for losses
function triggerParticles() {
  const particles = [];
  const particleCount = 100;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * particleCanvas.width,
      y: Math.random() * particleCanvas.height,
      size: Math.random() * 5 + 2,
      speedX: Math.random() * 6 - 3,
      speedY: Math.random() * 6 - 3,
      color: `rgba(239, 68, 68, ${Math.random() * 0.5 + 0.5})`,
    });
  }

  function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    let aliveParticles = 0;

    particles.forEach((particle) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.speedY += 0.1; // gravity

      if (particle.y < particleCanvas.height) {
        aliveParticles++;

        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        particleCtx.fillStyle = particle.color;
        particleCtx.fill();
      }
    });

    if (aliveParticles > 0) {
      requestAnimationFrame(animateParticles);
    }
  }

  animateParticles();
}

function updateBalanceDisplay() {
  const balanceElements = [
    ...document.querySelectorAll("#balanceDisplay"),
    document.getElementById("balanceDisplayMobile"),
    document.getElementById("mobileBalance"),
  ];

  balanceElements.forEach((el) => {
    if (el) el.textContent = `$${balance.toFixed(2)}`;
  });

  // Pulse animation when balance updates
  balanceElements.forEach((el) => {
    if (el) {
      el.classList.add("animate__animated", "animate__pulse");
      setTimeout(() => {
        el.classList.remove("animate__animated", "animate__pulse");
      }, 1000);
    }
  });
}

function validateBetInput() {
  const input = document.getElementById("betAmount");
  let value = parseFloat(input.value) || 0;
  value = Math.max(0.1, Math.min(balance, value));
  value = Math.round(value * 10) / 10; // Ensure 1 decimal place
  input.value = value.toFixed(1);
  return value;
}

function getRandomNumber() {
  return Math.floor(Math.random() * 99) + 1;
}

function adjustBet(delta) {
  if (soundEnabled) playClickSound();

  const input = document.getElementById("betAmount");
  let value = parseFloat(input.value) || 0;
  value = Math.max(0.1, value + delta * 0.1);
  value = Math.round(value * 10) / 10; // ensure 1 decimal precision
  input.value = value.toFixed(1);

  // Button press animation
  const button =
    delta > 0 ? input.nextElementSibling : input.previousElementSibling;
  button.classList.add("animate__animated", "animate__pulse");
  setTimeout(() => {
    button.classList.remove("animate__animated", "animate__pulse");
  }, 300);
}

function updateSliderValue(val) {
  if (soundEnabled) playSlideSound();

  sliderValue = Number(val);
  document.getElementById("sliderValue").innerText = val;
  document.getElementById("sidebarSliderValue").innerText = `Number: ${val}`;
  updateMultiplier();
}

function setCondition(newCondition) {
  if (soundEnabled) playClickSound();

  condition = newCondition;
  document.getElementById("btnLess").classList.remove("btn-selected");
  document.getElementById("btnMore").classList.remove("btn-selected");

  if (condition === "less") {
    document.getElementById("btnLess").classList.add("btn-selected");
    document
      .getElementById("btnLess")
      .classList.add("animate__animated", "animate__pulse");
    setTimeout(() => {
      document
        .getElementById("btnLess")
        .classList.remove("animate__animated", "animate__pulse");
    }, 500);
  } else {
    document.getElementById("btnMore").classList.add("btn-selected");
    document
      .getElementById("btnMore")
      .classList.add("animate__animated", "animate__pulse");
    setTimeout(() => {
      document
        .getElementById("btnMore")
        .classList.remove("animate__animated", "animate__pulse");
    }, 500);
  }

  updateMultiplier();
  document.getElementById("btnGuess").disabled = false;

  // Button glow effect
  const resultGlow = document.getElementById("result-glow");
  resultGlow.style.background =
    condition === "less"
      ? "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)"
      : "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)";
  resultGlow.style.opacity = "0.5";
  setTimeout(() => {
    resultGlow.style.opacity = "0";
  }, 1000);
}

function updateMultiplier() {
  if (!condition) {
    document.getElementById("multiplierDisplay").textContent = "-";
    return;
  }

  let chance = condition === "less" ? sliderValue : 100 - sliderValue;
  if (chance < 1) chance = 1;

  const rawMultiplier = 100 / chance;
  let adjusted = rawMultiplier * (1 - HOUSE_EDGE);
  adjusted = Math.max(1, adjusted); // Ensure it's not below 1

  const displayValue = adjusted.toFixed(2);
  document.getElementById("multiplierDisplay").textContent = `${displayValue}x`;

  // Color based on multiplier value
  const multiplierElement = document.getElementById("multiplierDisplay");
  multiplierElement.classList.remove(
    "text-green-500",
    "text-yellow-500",
    "text-red-500"
  );

  if (adjusted >= 5) {
    multiplierElement.classList.add("text-red-500");
  } else if (adjusted >= 2) {
    multiplierElement.classList.add("text-yellow-500");
  } else {
    multiplierElement.classList.add("text-green-500");
  }
}

function showBetError() {
  const betWrapper = document.getElementById("betWrapper");
  betWrapper.classList.add("border-red-500", "shake-animation");
  setTimeout(() => {
    betWrapper.classList.remove("shake-animation");
  }, 500);
}

function hideBetError() {
  document.getElementById("betWrapper").classList.remove("border-red-500");
}

function animateNumberCycle(finalNumber, callback) {
  const resultEl = document.getElementById("result");
  const resultGlow = document.getElementById("result-glow");
  isAnimating = true;
  resultEl.textContent = "?";
  resultEl.classList.remove(
    "text-green-500",
    "text-red-600",
    "number-cycle",
    "result-win",
    "result-lose"
  );
  resultGlow.style.opacity = "0";

  // Disable all buttons during animation
  document.getElementById("btnGuess").disabled = true;
  document.getElementById("btnLess").disabled = true;
  document.getElementById("btnMore").disabled = true;
  document.getElementById("slider").disabled = true;

  // Start with a few fast numbers
  let count = 0;
  const totalCycles = 15 + Math.floor(Math.random() * 10); // 15-24 cycles
  const startTime = Date.now();
  const duration = 1500 + Math.random() * 500; // 1.5-2 seconds total

  function updateNumber() {
    if (!isAnimating) return;

    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      // Final number
      resultEl.textContent = finalNumber;
      resultEl.classList.add("number-cycle");

      // Add glow effect based on result (will be set in callback)
      resultGlow.style.opacity = "0.7";

      isAnimating = false;
      callback();
      return;
    }

    // Slow down as we approach the end
    if (count < totalCycles) {
      const randomNum = Math.floor(Math.random() * 99) + 1;
      resultEl.textContent = randomNum;
      resultEl.classList.add("number-cycle");

      // Remove animation class after it completes to allow re-triggering
      setTimeout(() => {
        resultEl.classList.remove("number-cycle");
      }, 100);

      count++;

      // Gradually slow down the animation
      let delay;
      if (count < totalCycles * 0.3) {
        delay = 50 + Math.random() * 50; // Fast at first (50-100ms)
      } else if (count < totalCycles * 0.7) {
        delay = 100 + Math.random() * 100; // Then medium speed (100-200ms)
      } else {
        delay = 150 + Math.random() * 150; // Then slower (150-300ms)
      }

      setTimeout(updateNumber, delay);
    } else {
      // Show the final number with animation
      resultEl.textContent = finalNumber;
      resultEl.classList.add("number-cycle");
      resultGlow.style.opacity = "0.7";
      isAnimating = false;
      callback();
    }
  }

  updateNumber();
}

function guessNumber() {
  if (isAnimating) return;

  if (soundEnabled) playClickSound();

  const betInput = document.getElementById("betAmount");
  let betAmount = parseFloat(betInput.value);
  if (isNaN(betAmount)) return;

  if (betAmount > balance) {
    betAmount = balance;
    betInput.value = balance.toFixed(1);
    showBetError();
    return;
  }

  hideBetError();

  const result = getRandomNumber();
  const resultEl = document.getElementById("result");
  const resultGlow = document.getElementById("result-glow");

  // Disable button during animation
  document.getElementById("btnGuess").disabled = true;

  // Button press animation
  document
    .getElementById("btnGuess")
    .classList.add("animate__animated", "animate__pulse");
  setTimeout(() => {
    document
      .getElementById("btnGuess")
      .classList.remove("animate__animated", "animate__pulse");
  }, 300);

  animateNumberCycle(result, () => {
    // Animation complete - process the result
    const win =
      (condition === "greater" && result > sliderValue) ||
      (condition === "less" && result < sliderValue);

    let chance = condition === "less" ? sliderValue : 100 - sliderValue;
    const multiplier = (100 / chance) * (1 - HOUSE_EDGE);

    // Update stats
    stats.totalWagered += betAmount;

    if (win) {
      const winAmount = betAmount * (multiplier - 1);
      balance += winAmount;
      stats.wins++;
      stats.currentStreak++;
      if (stats.currentStreak > stats.maxStreak)
        stats.maxStreak = stats.currentStreak;
      if (winAmount > stats.biggestWin) stats.biggestWin = winAmount;

      resultEl.classList.add("text-green-500", "result-win");
      resultGlow.style.background =
        "radial-gradient(circle, rgba(74, 222, 128, 0.5) 0%, transparent 70%)";
      triggerConfetti();
      if (soundEnabled) playWinSound();
    } else {
      balance -= betAmount;
      stats.losses++;
      stats.currentStreak = 0;

      resultEl.classList.add("text-red-600", "result-lose");
      resultGlow.style.background =
        "radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, transparent 70%)";
      triggerParticles();
      if (soundEnabled) playLoseSound();
    }

    updateBalanceDisplay();

    // Re-enable buttons
    document.getElementById("btnGuess").disabled = false;
    document.getElementById("btnLess").disabled = false;
    document.getElementById("btnMore").disabled = false;
    document.getElementById("slider").disabled = false;

    // Add to history
    history.unshift({ number: result, win });

    if (history.length > 7) history.pop();
    addToHistory({ number: result, win });
  });
}

function addToHistory({ number, win }) {
  const container = document.getElementById("history");
  const maxItems = 7;
  const itemHeight = 48; // Height of each history item including gap

  // Create new item
  const entry = document.createElement("div");
  entry.className =
    "history-item rounded-full w-10 h-10 flex items-center justify-center font-bold text-white";
  entry.textContent = number;

  // Color based on result
  if (win) {
    entry.classList.add("bg-green-500/20", "border", "border-green-500/30");
  } else {
    entry.classList.add("bg-red-500/20", "border", "border-red-500/30");
  }

  // Insert new item at the top
  container.insertBefore(entry, container.firstChild);

  // Animate existing items down
  const children = Array.from(container.children);
  children.forEach((item, index) => {
    if (index === 0) return; // Skip the new item

    item.style.transition = "transform 300ms ease, opacity 300ms ease";
    item.style.transform = `translateY(${itemHeight}px)`;

    // Only fade out items that will be removed
    if (index >= maxItems) {
      item.style.opacity = "0";
    } else {
      item.style.opacity = `${1 - (index / maxItems) * 0.6}`;
    }
  });

  // Remove excess items after they've animated out
  setTimeout(() => {
    const children = Array.from(container.children);
    children.forEach((item, index) => {
      if (index >= maxItems) {
        // Only remove if it's fully out of view (opacity 0)
        if (item.style.opacity === "0") {
          container.removeChild(item);
        }
      } else {
        // Reset styles for remaining items
        item.style.transition = "";
        item.style.transform = "";

        // Adjust size based on position
        item.classList.remove("text-3xl", "text-xl", "text-lg", "text-base");
        if (index === 0) {
          item.classList.add("text-3xl", "font-extrabold");
        } else if (index === 1) {
          item.classList.add("text-xl", "font-bold");
        } else if (index === 2) {
          item.classList.add("text-lg", "font-bold");
        } else {
          item.classList.add("text-base", "font-medium");
        }
      }
    });
  }, 300);
}

function updateHistory() {
  const container = document.getElementById("history");
  container.innerHTML = "";

  history.forEach((item, index) => {
    addToHistory(item);
  });
}

function showStats() {
  document.getElementById("statWins").textContent = stats.wins;
  document.getElementById("statLosses").textContent = stats.losses;
  document.getElementById(
    "statWagered"
  ).textContent = `$${stats.totalWagered.toFixed(2)}`;
  document.getElementById(
    "statBigWin"
  ).textContent = `$${stats.biggestWin.toFixed(2)}`;

  const winRate =
    stats.wins + stats.losses > 0
      ? (stats.wins / (stats.wins + stats.losses)) * 100
      : 0;
  document.getElementById("statWinRate").textContent = `${winRate.toFixed(1)}%`;

  document.getElementById("statsModal").classList.remove("hidden");
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const icon = document.querySelector("#soundToggle svg");
  if (soundEnabled) {
    icon.innerHTML =
      '<path d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM32,96H72v64H32Z"></path>';
  } else {
    icon.innerHTML =
      '<path d="M200,128a71.33,71.33,0,0,1-15.78,44.91,7.9,7.9,0,0,1-6.67,3.65,8,8,0,0,1-3.88-1,8.1,8.1,0,0,1-3.87-10.73,56.3,56.3,0,0,0,0-73.6,8.1,8.1,0,0,1,3.87-10.73,8,8,0,0,1,10.72,3.86A71.33,71.33,0,0,1,200,128Zm-16.46,88a8,8,0,0,1-6.67,3.65,8.23,8.23,0,0,1-3.88-1,8.1,8.1,0,0,1-3.87-10.73,104.44,104.44,0,0,0,0-159.74,8.1,8.1,0,0,1,3.87-10.73,8,8,0,0,1,10.72,3.86,120.44,120.44,0,0,1,0,183.52ZM32,96H72v64H32Z"></path>';
  }
}

window.onload = function () {
  // Initialize game elements
  initCanvases();
  updateBalanceDisplay();
  updateSliderValue(sliderValue);
  updateMultiplier();

  // Disable guess button initially
  document.getElementById("btnGuess").disabled = true;

  // Add floating animation to the logo
  document.querySelector("h2").classList.add("float-animation");

  // Set up input validation
  document
    .getElementById("betAmount")
    .addEventListener("input", validateBetInput);
  document
    .getElementById("betAmount")
    .addEventListener("blur", validateBetInput);

  // Set up sound toggle - only if the element exists
  const soundToggle = document.getElementById("soundToggle");
  if (soundToggle) {
    soundToggle.addEventListener("click", toggleSound);
  }

  // Set up keyboard controls
  document.addEventListener("keydown", function (e) {
    if (isAnimating) return;

    switch (e.key) {
      case "ArrowLeft":
        setCondition("less");
        break;
      case "ArrowRight":
        setCondition("greater");
        break;
      case "Enter":
        if (!document.getElementById("btnGuess").disabled) {
          guessNumber();
        }
        break;
      case "ArrowUp":
        adjustBet(1);
        break;
      case "ArrowDown":
        adjustBet(-1);
        break;
      case "s":
      case "S":
        showStats();
        break;
    }
  });
};

// Handle window resize
window.addEventListener("resize", () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
});
