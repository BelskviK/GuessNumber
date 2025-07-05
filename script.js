const HOUSE_EDGE = 0.05;
let balance = 100;
let history = [];
let condition = null;
let sliderValue = 50;
let isAnimating = false;

function updateBalanceDisplay() {
  document.getElementById("balanceDisplay").textContent = `$${balance.toFixed(
    2
  )}`;
}

function getRandomNumber() {
  return Math.floor(Math.random() * 99) + 1;
}

function adjustBet(delta) {
  const input = document.getElementById("betAmount");
  let value = parseFloat(input.value) || 0;
  value = Math.max(0.1, value + delta * 0.1);
  value = Math.round(value * 10) / 10; // ensure 1 decimal precision
  input.value = value.toFixed(1);
}

function updateSliderValue(val) {
  sliderValue = Number(val);
  document.getElementById("sliderValue").innerText = val;
  document.getElementById("sidebarSliderValue").innerText = `Number: ${val}`;
  updateMultiplier();
}

function setCondition(newCondition) {
  condition = newCondition;
  document.getElementById("btnLess").classList.remove("btn-selected");
  document.getElementById("btnMore").classList.remove("btn-selected");

  if (condition === "less") {
    document.getElementById("btnLess").classList.add("btn-selected");
  } else {
    document.getElementById("btnMore").classList.add("btn-selected");
  }

  updateMultiplier();
  document.getElementById("btnGuess").disabled = false;
}

function updateMultiplier() {
  if (!condition) {
    document.getElementById("multiplierDisplay").textContent = "-";
    return;
  }
  let chance = condition === "less" ? sliderValue : 100 - sliderValue;
  if (chance < 1) chance = 1;
  const rawMultiplier = 100 / chance;
  const adjusted = (rawMultiplier * (1 - HOUSE_EDGE)).toFixed(2);
  document.getElementById("multiplierDisplay").textContent = `${adjusted}x`;
}

function showBetError() {
  document
    .getElementById("betWrapper")
    .classList.add("border", "border-red-500");
}

function hideBetError() {
  document
    .getElementById("betWrapper")
    .classList.remove("border", "border-red-500");
}

function animateNumberCycle(finalNumber, callback) {
  const resultEl = document.getElementById("result");
  isAnimating = true;
  resultEl.textContent = "?";
  resultEl.classList.remove("text-green-500", "text-red-600", "number-cycle");

  // Start with a few fast numbers
  let count = 0;
  const totalCycles = 15 + Math.floor(Math.random() * 10); // 15-24 cycles
  const startTime = Date.now();
  const duration = 1500; // 1.5 seconds total

  function updateNumber() {
    if (!isAnimating) return;

    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      // Final number
      resultEl.textContent = finalNumber;
      resultEl.classList.add("number-cycle");
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
      isAnimating = false;
      callback();
    }
  }

  updateNumber();
}

function guessNumber() {
  if (isAnimating) return;

  const betInput = document.getElementById("betAmount");
  let betAmount = parseFloat(betInput.value);
  if (isNaN(betAmount)) return;

  if (betAmount > balance) {
    betAmount = balance;
    betInput.value = balance;
    showBetError();
    return;
  }

  hideBetError();

  const result = getRandomNumber();
  const resultEl = document.getElementById("result");

  // Disable button during animation
  document.getElementById("btnGuess").disabled = true;

  animateNumberCycle(result, () => {
    // Animation complete - process the result
    const win =
      (condition === "greater" && result > sliderValue) ||
      (condition === "less" && result < sliderValue);

    let chance = condition === "less" ? sliderValue : 100 - sliderValue;
    const multiplier = (100 / chance) * (1 - HOUSE_EDGE);

    if (win) {
      balance += betAmount * (multiplier - 1);
      resultEl.classList.add("text-green-500");
    } else {
      balance -= betAmount;
      resultEl.classList.add("text-red-600");
    }

    updateBalanceDisplay();

    // Re-enable button
    document.getElementById("btnGuess").disabled = false;

    // Add to history
    history.unshift(result);
    if (history.length > 7) history.pop();
    updateHistory();
  });
}

function updateHistory() {
  const container = document.getElementById("history");
  container.innerHTML = "";
  const maxItems = 7;

  history.forEach((num, index) => {
    const div = document.createElement("div");
    div.className = "flex justify-center p-2 items-center";

    // Calculate progressive opacity for color
    const brightness = 1 - (index / maxItems) * 0.6; // from 1 to 0.4 opacity
    div.style.color = `rgba(255, 255, 255, ${brightness.toFixed(2)})`;

    // Bigger text for the first item
    if (index === 0) {
      div.innerHTML = `<h2 class="text-3xl font-extrabold leading-tight">${num}</h2>`;
    } else {
      div.innerHTML = `<h2 class="text-base font-bold leading-tight">${num}</h2>`;
    }

    container.appendChild(div);
  });
}

window.onload = () => {
  updateBalanceDisplay();
  updateSliderValue(sliderValue);
  updateMultiplier();
  document.getElementById("btnGuess").disabled = true;
};
