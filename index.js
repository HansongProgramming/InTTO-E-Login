async function getWeather() {
    const city = 'Baguio';
    const API_KEY = 'b6b04c176aef4bf7a8f11122250706';
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const temperature = data.current.temp_c;

        return temperature;
    } catch (err) {
        console.error('Error fetching weather data:', err);
    }
}

setInterval(() => {
    const moment = moment();

    const currentDate = moment.format('DD/MM/YYYY');
    const currentTime = moment.format('HH:mm');

    const dateElement = document.getElementById('date');
    const timeElement = document.getElementById('time');
    const weatherElement = document.getElementById('weather');

    dateElement.textContent = currentDate;
    timeElement.textContent = currentTime;

    getWeather().then(temperature => {
        if (temperature !== undefined) {
            weatherElement.textContent = `${temperature}°C`;
        } else {
            console.log('Could not retrieve the temperature.');
        }
    }).catch(err => {
        console.error('Error:', err);
    });

}, 15000);


setInterval(() => {
    const momentElement = document.getElementById('moment');
    const spontaneousElement = document.getElementById('spontaneous');
    const currentDisplay = momentElement.style.display;

    if (currentDisplay === 'none' || currentDisplay === '') {
        spontaneousElement.style.display = 'block';
        momentElement.style.display = 'block';
        setTimeout(() => {
            spontaneousElement.style.display = 'none';
            momentElement.style.display = 'none';
        }, 4000);
    } else {
        spontaneousElement.style.display = 'none';
        momentElement.style.display = 'none';
    }
}, 900000);
