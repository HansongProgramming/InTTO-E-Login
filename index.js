const API_KEY = 'b6b04c176aef4bf7a8f11122250706';
const CITY = 'Baguio';
const BUTTON_IDS = ['internlogin', 'guestlogin', 'adminlogin'];


async function getWeather() {
  const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${CITY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    return data.current.temp_c;
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
  if (timeEl) timeEl.textContent = theMoment.format('HH:mm');

  const temperature = await getWeather();
  if (weatherEl) {
    weatherEl.textContent = temperature !== null ? `${temperature}°C` : 'Weather unavailable';
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

function setupLoginButtons() {
  BUTTON_IDS.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        window.location.href = `${id}.html`;
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