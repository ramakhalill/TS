export async function getLocation(city) {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error("Location not found");
    }
    return data.results[0];
}
export async function getWeather(latitude, longitude, unit = "metric") {
    const tempUnit = unit === "metric" ? "celsius" : "fahrenheit";
    const windUnit = unit === "metric" ? "kmh" : "mph";
    const url = `
https://api.open-meteo.com/v1/forecast
?latitude=${latitude}
&longitude=${longitude}
&current_weather=true
&hourly=temperature_2m,apparent_temperature,relativehumidity_2m,precipitation
&daily=temperature_2m_max,temperature_2m_min,weathercode
&temperature_unit=${tempUnit}
&wind_speed_unit=${windUnit}
&timezone=auto
&forecast_days=7` +
        `&hourly=temperature_2m,weathercode,relativehumidity_2m,apparent_temperature,precipitation` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min
  `;
    const response = await fetch(url);
    return response.json();
}
