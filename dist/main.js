import { getLocation, getWeather } from "./api.js";
// import {tempUnit,windUnit,precipUnit} from "./status/status"
/* ===============================
DOM ELEMENTS (MATCH HTML)
================================ */
const input = document.querySelector(".searchbar input");
const searchButton = document.querySelector(".searchbutton");
const dropdown = document.querySelector(".dropdown");
const unitsButton = document.querySelector(".settings");
const options = document.querySelectorAll(".option");
const errorState = document.querySelector(".error-state");
const retryButton = document.querySelector(".retry-button");
/* ------------search suggestions-------------*/
const suggestionsBox = document.querySelector(".search-suggestions");
function showSuggestions(items) {
    suggestionsBox.innerHTML = "";
    if (items.length === 0)
        return;
    items.forEach((item) => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.textContent = item;
        div.addEventListener("click", () => {
            input.value = item;
            suggestionsBox.innerHTML = "";
        });
        suggestionsBox.appendChild(div);
    });
}
// -------------------main card---------------
const mainCard = document.querySelector(".maincard");
const city = mainCard.querySelector("h2");
const date = mainCard.querySelector("h3");
const temp = mainCard.querySelector("h1");
const icon = mainCard.querySelector("img");
/* -------------state-----------------*/
let tempUnit = "metric";
let windUnit = "metric";
let precipUnit = "metric";
// -------------weather details------------------
const feelsLike = document.querySelector(".feels-like");
const humidity = document.querySelector(".humidity");
const wind = document.querySelector(".wind");
const precip = document.querySelector(".precipitation");
// ------------daily weather----------------
const dailyCards = document.querySelectorAll(".daily-card");
// ------------Sound------------
let weatherAudio = null;
function playWeatherSound(type) {
    if (weatherAudio) {
        weatherAudio.pause();
        weatherAudio.currentTime = 0;
    }
    weatherAudio = new Audio(`assets/sounds/${type}.mp3`);
    weatherAudio.loop = true;
    weatherAudio.volume = 0.4;
    weatherAudio.play().catch(() => {
        // browser blocks autoplay until user interaction (normal)
    });
}
function handleWeatherSound(code) {
    if (code >= 51 && code <= 67) {
        playWeatherSound("rain");
    }
    else if (code >= 95) {
        playWeatherSound("storm");
    }
    else {
        playWeatherSound("sunny");
    }
}
//---------for day choose----------
let selectedDayIndex = 0; // 0 = today, 1 = tomorrow, etc.
const dayButton = document.querySelector(".day-button");
const dayDropdown = document.querySelector(".day-dropdown");
const selectedDayEl = document.querySelector(".selected-day");
//-------------open/close dropdown menu------------
unitsButton.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
});
document.addEventListener("click", () => {
    dropdown.classList.remove("open");
});
//----------- dropdown menu active status & save data ---------------
options.forEach((option) => {
    option.addEventListener("click", (e) => {
        e.stopPropagation();
        const section = option.closest(".dropdown-section");
        if (!section)
            return;
        section
            .querySelectorAll(".option")
            .forEach((btn) => btn.classList.remove("active"));
        option.classList.add("active");
        if (option.dataset.temp) {
            tempUnit = option.dataset.temp;
        }
        if (option.dataset.wind) {
            windUnit = option.dataset.wind;
        }
        if (option.dataset.precip) {
            precipUnit = option.dataset.precip;
        }
    });
});
//----------making the date readable-----------
function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
function getWeatherIcon(code) {
    if (code === 0)
        return "assets/images/weather/sunny.webp";
    if (code <= 3)
        return "assets/images/weather/partly-cloudy.webp";
    if (code <= 48)
        return "assets/images/weather/overcast.webp";
    if (code <= 67)
        return "assets/images/weather/rain.webp";
    if (code <= 77)
        return "assets/images/weather/snow.webp";
    if (code <= 99)
        return "assets/images/weather/storm.webp";
    return "assets/images/weather/clear-day.svg";
}
function updateMainCard(location, weather) {
    if (!weather.current_weather) {
        throw new Error("current_weather is missing");
    }
    city.textContent = `${location.name}, ${location.country}`;
    date.textContent = formatDate(weather.current_weather.time);
    temp.textContent = `${Math.round(weather.current_weather.temperature)}°`;
    const code = weather.current_weather.weathercode;
    icon.src = getWeatherIcon(code);
    icon.alt = "weather icon";
    handleWeatherSound(code);
}
function updateWeatherDetails(weather) {
    // feels like (apparent temperature)
    feelsLike.textContent =
        Math.round(weather.hourly.apparent_temperature[0]) + "°";
    // humidity
    humidity.textContent =
        weather.hourly.relativehumidity_2m[0] + "%";
    // wind speed
    wind.textContent =
        Math.round(weather.current_weather.windspeed) +
            (windUnit === "metric" ? " km/h" : " mph");
    // precipitation
    precip.textContent =
        weather.hourly.precipitation[0] +
            (precipUnit === "metric" ? " mm" : " in");
}
function getDayName(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
}
function updateDailyWeather(weather) {
    const days = weather.daily.time;
    const maxTemps = weather.daily.temperature_2m_max;
    const minTemps = weather.daily.temperature_2m_min;
    const codes = weather.daily.weathercode;
    dailyCards.forEach((card, index) => {
        if (!days[index])
            return;
        const dayEl = card.querySelector(".day");
        const dayTempEl = card.querySelector(".day-temp");
        const nightTempEl = card.querySelector(".night-temp");
        const iconEl = card.querySelector(".weather-icon");
        dayEl.textContent = getDayName(days[index]);
        dayTempEl.textContent =
            Math.round(maxTemps[index]) + "°";
        nightTempEl.textContent =
            Math.round(minTemps[index]) + "°";
        iconEl.src = getWeatherIcon(codes[index]);
        iconEl.alt = "daily weather icon";
    });
}
function updateHourlyWeather(weather) {
    const selectedDate = weather.daily.time[selectedDayIndex];
    const hourly = weather.hourly;
    const hourlyList = document.querySelector(".hourly-list");
    hourlyList.innerHTML = "";
    const indexes = [];
    hourly.time.forEach((t, i) => {
        if (t.startsWith(selectedDate)) {
            indexes.push(i);
        }
    });
    indexes.forEach((i) => {
        const hour = new Date(hourly.time[i]).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true,
        });
        const row = document.createElement("div");
        row.className = "hour-row";
        row.innerHTML = `
      <div class="hour-left">
        <img src="${getWeatherIcon(hourly.weathercode[i])}" />
        <span>${hour}</span>
      </div>
      <span class="hour-temp">
        ${Math.round(hourly.temperature_2m[i])}°
      </span>
    `;
        hourlyList.appendChild(row);
    });
}
function showDayDropdown(weather) {
    dayDropdown.innerHTML = "";
    weather.daily.time.forEach((date, index) => {
        const btn = document.createElement("button");
        btn.className = "day-option";
        const dayName = new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
        });
        btn.textContent = dayName;
        btn.addEventListener("click", () => {
            selectedDayIndex = index;
            selectedDayEl.textContent = dayName;
            dayDropdown.classList.remove("open");
            updateHourlyWeather(weather);
        });
        dayDropdown.appendChild(btn);
    });
}
dayButton.addEventListener("click", () => {
    dayDropdown.classList.toggle("open");
});
// -------------------------
function validateSearch(value) {
    if (!value.trim())
        return "enter a name";
    if (/^\d+$/.test(value))
        return "city name cant be a number";
    if (value.length < 2)
        return "city name short!";
    return null;
}
function getRecentSearches() {
    return JSON.parse(localStorage.getItem("recentSearches") || "[]");
}
function saveRecentSearch(city) {
    const recents = getRecentSearches()
        .filter(c => c.toLowerCase() !== city.toLowerCase());
    recents.unshift(city);
    localStorage.setItem("recentSearches", JSON.stringify(recents.slice(0, 5)));
}
async function searchCities(query) {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`);
    const data = await res.json();
    return data.results || [];
}
/* ===============================
RECENT SEARCHES (ON FOCUS)
================================ */
input.addEventListener("focus", () => {
    const recents = getRecentSearches();
    showSuggestions(recents);
});
/* ===============================
AUTOCOMPLETE SEARCH
================================ */
let timer;
input.addEventListener("input", () => {
    const value = input.value.trim();
    clearTimeout(timer);
    if (value.length < 2) {
        suggestionsBox.innerHTML = "";
        return;
    }
    timer = window.setTimeout(async () => {
        const cities = await searchCities(value);
        const names = cities.map((c) => `${c.name}, ${c.country}`); //cuz show suggestions needs string!!
        showSuggestions(names);
    }, 300);
});
/* ===============================
LOAD LAST CITY ON PAGE LOAD
================================ */
window.addEventListener("DOMContentLoaded", async () => {
    const lastCity = localStorage.getItem("lastCity");
    if (!lastCity)
        return;
    try {
        const location = await getLocation(lastCity);
        const weather = await getWeather(location.latitude, location.longitude, tempUnit);
        hideErrorState();
        updateMainCard(location, weather);
        updateWeatherDetails(weather);
        updateDailyWeather(weather);
        showDayDropdown(weather);
        updateHourlyWeather(weather);
    }
    catch (error) {
        console.error("Failed to load last city", error);
    }
});
function showErrorState() {
    errorState.classList.remove("hidden");
}
function hideErrorState() {
    errorState.classList.add("hidden");
}
const searchError = document.querySelector(".search-error");
function showInputError(message) {
    searchError.textContent = message;
    searchError.classList.remove("hidden");
}
function hideSearchError() {
    searchError.classList.add("hidden");
}
//---------search error------------
const resultsSection = document.querySelector("#results-section");
function showSearchOnly(message) {
    resultsSection.classList.add("hidden");
    searchError.textContent = message;
    searchError.classList.remove("hidden");
}
function showResults() {
    resultsSection.classList.remove("hidden");
    searchError.classList.add("hidden");
}
/* ===============================
SEARCH WEATHER
================================ */
searchButton.addEventListener("click", async () => {
    try {
        hideErrorState();
        const city = input.value.trim();
        const error = validateSearch(city);
        if (!city)
            return;
        if (error) {
            showSearchOnly(error);
            return;
        }
        hideSearchError();
        console.log("Searching for:", city);
        const location = await getLocation(city);
        if (!location) {
            showInputError("No search result found!");
            return;
        }
        console.log("Location:", location);
        const weather = await getWeather(location.latitude, location.longitude, tempUnit);
        console.log("Weather:", weather);
        hideErrorState(); // API error
        hideSearchError(); // input error
        updateMainCard(location, weather);
        updateWeatherDetails(weather);
        updateDailyWeather(weather);
        showDayDropdown(weather);
        updateHourlyWeather(weather);
        saveRecentSearch(location.name);
        localStorage.setItem("lastCity", location.name);
        hideErrorState();
        suggestionsBox.innerHTML = "";
        input.value = "";
    }
    catch (error) {
        console.error(error);
        showErrorState();
        suggestionsBox.innerHTML = "";
    }
});
retryButton.addEventListener("click", () => {
    hideErrorState();
    const lastCity = localStorage.getItem("lastCity");
    if (lastCity) {
        input.value = lastCity;
        searchButton.click();
    }
});
