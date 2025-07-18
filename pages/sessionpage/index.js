const API_KEY = 'b6b04c176aef4bf7a8f11122250706';
const CITY = 'Baguio';
const BUTTON_IDS = ['internlogin', 'guestlogin', 'adminlogin'];

async function getWeather() {
  const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${CITY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    return {
      temp: data.current.temp_c,
      icon: `https:${data.current.condition.icon}`,
      text: data.current.condition.text
    };
  } catch (err) {
    console.error('Error fetching weather data:', err);
    return null;
  }
}

async function renderWeatherDateTime() {
  const theMoment = moment();

  const dateEl = document.getElementById('date');
  const timeEl = document.getElementById('time');
  const weatherEl = document.getElementById('weather');

  if (dateEl) dateEl.textContent = theMoment.format('DD/MM/YYYY');
  if (timeEl) timeEl.textContent = theMoment.format('hh:mm A');

  const weather = await getWeather();
  if (weatherEl) {
    if (weather !== null) {
      weatherEl.innerHTML = `
        <img src="${weather.icon}" alt="${weather.text}">
        <span>${weather.temp}°C</span>
      `;
    } else {
      weatherEl.textContent = 'Weather unavailable';
    }
  }
}

async function handleAdminLogin(data) {
  try {
    const response = await fetch('http://127.0.0.1:3000/adminLogin', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Login failed");

    const result = await response.json();
    return result;
  } catch (err) {
    console.error("man idk:", err);
    return { success: false, message: err.message || "Unknown error" };
  }
}

function toggleMomentElements() {
  const momentEl = document.getElementById('moment');
  const spontaneousEl = document.getElementById('spontaneous');

  if (!momentEl || !spontaneousEl) return;

  const isHidden = momentEl.style.display === 'none' || momentEl.style.display === '';

  momentEl.style.display = isHidden ? 'block' : 'none';
  spontaneousEl.style.display = isHidden ? 'block' : 'none';

  if (isHidden) {
    setTimeout(() => {
      momentEl.style.display = 'none';
      spontaneousEl.style.display = 'none';
    }, 4000);
  }
}

function showAdminLoginInterface() {
  const container = document.querySelector("#selection-container");
  const buttons = container.querySelector(".login-selection");
  const headerText = document.querySelector("#E-login h1");

  if (buttons) buttons.style.display = 'none';
  if (headerText) headerText.style.display = 'none';

  // Remove any old login forms
  const oldWrapper = container.querySelector(".admin-form-wrapper");
  if (oldWrapper) oldWrapper.remove();

  const wrapper = document.createElement("div");
  wrapper.className = "admin-form-wrapper";
  wrapper.style.position = 'relative';  // Ensure it stacks properly
  wrapper.style.zIndex = '1000';        // High enough to be on top

  const search = document.createElement("div");
  search.className = "admin-search";

  const searchlebutton = document.createElement("div");
  searchlebutton.className = "search-buttones";

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.placeholder = "Enter Password";
  passwordInput.className = "password-input";
  passwordInput.style.zIndex = '1001'; // Make sure it's above all
  passwordInput.style.position = 'relative';

  const loginButton = document.createElement("p");
  loginButton.textContent = "Submit";
  loginButton.className = "submit-button";

  const backButton = document.createElement("p");
  backButton.textContent = "Back";
  backButton.className = "back-buttoner";

  const showError = (message) => {
    const existingError = search.querySelector(".error-message");
    if (existingError) existingError.remove();

    const errorEl = document.createElement("p");
    errorEl.className = "error-message";
    errorEl.textContent = message;
    errorEl.style.textAlign = "center";
    errorEl.style.color = "red";

    search.appendChild(errorEl);
  };

  loginButton.addEventListener("click", async () => {
    const password = passwordInput.value.trim();

    if (!password) {
      showError("Please Enter a Password.");
      return;
    }

    try {
      const result = await handleAdminLogin({ password });

      if (result?.success) {
        window.location.href = "../adminlogin/adminlogin.html";
      } else {
        showError("Wrong Password.");
        passwordInput.value = "";
      }
    } catch (err) {
      console.error("Login error:", err);
      showError("An error occurred. Try again.");
      passwordInput.value = "";
      setTimeout(() => passwordInput.focus(), 50);
    }
  });


  backButton.addEventListener("click", hideAdminLoginInterface);

  search.appendChild(passwordInput);
  search.appendChild(searchlebutton);
  searchlebutton.appendChild(loginButton);
  searchlebutton.appendChild(backButton);

  wrapper.appendChild(search);
  container.appendChild(wrapper);
}


function hideAdminLoginInterface() {
  const container = document.querySelector("#selection-container");
  const wrapper = container.querySelector(".admin-form-wrapper");

  if (wrapper) wrapper.remove();

  const buttons = container.querySelector(".login-selection");
  const headerText = document.querySelector("#E-login h1");

  if (buttons) buttons.style.display = '';
  if (headerText) headerText.style.display = '';
}


function setupLoginButtons() {
  BUTTON_IDS.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        id !== "adminlogin" ?
          window.location.href = `../${id}/${id}.html` :
          showAdminLoginInterface();
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupLoginButtons();
  renderWeatherDateTime();
  toggleMomentElements();

  setInterval(renderWeatherDateTime, 15000);
  setInterval(toggleMomentElements, 900000);
});
