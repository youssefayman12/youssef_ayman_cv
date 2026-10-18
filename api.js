/* =========================================================
   api.js — Assignment 3: External API integration
   Youssef Ayman Saleh

   Two live data features, each using fetch + async/await and
   handling both a loading state and a failed-request state:

     1. Weather — Open-Meteo forecast, no API key. The city list
        carries its own coordinates, so picking one goes straight
        to the forecast call with nothing to look up first.
     2. Quotes  — tries QuoteSlate first, then DummyJSON as a
        second independent source if that fails, and only falls
        back to a small local list if both are unreachable.

   Kept in its own file, separate from script.js, so the DOM/UI
   interactivity from Assignment 2 and the external API calls
   added in Assignment 3 stay easy to tell apart.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initWeatherWidget();
  initQuoteWidget();
});

/* ---------------------------------------------------------
   1. Weather — Open-Meteo
   The <select> in index.html carries each city's latitude
   and longitude as data attributes, so choosing one goes
   straight to a single forecast call — no separate geocoding
   lookup, and nothing for that lookup to fail on.
   --------------------------------------------------------- */

// WMO weather codes -> a short description and an emoji icon.
// https://open-meteo.com/en/docs (Weather interpretation codes)
var WEATHER_CODES = {
  0: ['Clear sky', '☀️'],
  1: ['Mainly clear', '🌤️'],
  2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Depositing rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'],
  53: ['Moderate drizzle', '🌦️'],
  55: ['Dense drizzle', '🌧️'],
  56: ['Light freezing drizzle', '🌧️'],
  57: ['Dense freezing drizzle', '🌧️'],
  61: ['Slight rain', '🌦️'],
  63: ['Moderate rain', '🌧️'],
  65: ['Heavy rain', '🌧️'],
  66: ['Light freezing rain', '🌧️'],
  67: ['Heavy freezing rain', '🌧️'],
  71: ['Slight snowfall', '🌨️'],
  73: ['Moderate snowfall', '🌨️'],
  75: ['Heavy snowfall', '❄️'],
  77: ['Snow grains', '❄️'],
  80: ['Slight rain showers', '🌦️'],
  81: ['Moderate rain showers', '🌧️'],
  82: ['Violent rain showers', '⛈️'],
  85: ['Slight snow showers', '🌨️'],
  86: ['Heavy snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm with slight hail', '⛈️'],
  97: ['Heavy thunderstorm', '⛈️'],
  99: ['Thunderstorm with heavy hail', '⛈️']
};

function describeWeatherCode(code) {
  return WEATHER_CODES[code] || ['Conditions unavailable', '🌡️'];
}

function initWeatherWidget() {
  var form = document.getElementById('weather-form');
  var citySelect = document.getElementById('weather-city');
  var result = document.getElementById('weather-result');
  if (!form || !citySelect || !result) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    loadWeather();
  });

  // Show weather for the pre-selected city as soon as the page loads.
  loadWeather();

  async function loadWeather() {
    var option = citySelect.options[citySelect.selectedIndex];
    var cityLabel = option.textContent;
    var lat = option.getAttribute('data-lat');
    var lon = option.getAttribute('data-lon');

    result.innerHTML = '';
    var loading = document.createElement('p');
    loading.className = 'api-status';
    loading.textContent = 'Loading weather for ' + cityLabel + '…';
    result.appendChild(loading);

    try {
      var weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
        '&longitude=' + lon + '&current=temperature_2m,weather_code';
      var weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) {
        throw new Error('Forecast request failed (' + weatherResponse.status + ')');
      }
      var weatherData = await weatherResponse.json();
      var current = weatherData.current;
      if (!current) {
        throw new Error('No current-weather data in the response');
      }

      renderWeather(cityLabel, current);
    } catch (err) {
      showWeatherError('Couldn’t reach the weather service right now. Please try again in a moment.');
    }
  }

  function renderWeather(cityLabel, current) {
    var codeInfo = describeWeatherCode(current.weather_code);
    var description = codeInfo[0];
    var icon = codeInfo[1];

    result.innerHTML = '';
    var card = document.createElement('div');
    card.className = 'weather-card';

    var iconEl = document.createElement('div');
    iconEl.className = 'weather-card__icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = icon;

    var info = document.createElement('div');
    info.className = 'weather-card__info';

    var temp = document.createElement('p');
    temp.className = 'weather-card__temp';
    temp.textContent = Math.round(current.temperature_2m) + '°C';

    var condition = document.createElement('p');
    condition.className = 'weather-card__condition';
    condition.textContent = description;

    var place_p = document.createElement('p');
    place_p.className = 'weather-card__place';
    place_p.textContent = cityLabel;

    info.appendChild(temp);
    info.appendChild(condition);
    info.appendChild(place_p);
    card.appendChild(iconEl);
    card.appendChild(info);
    result.appendChild(card);
  }

  function showWeatherError(message) {
    result.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'api-status api-status--error';
    p.textContent = message;
    result.appendChild(p);
  }
}

/* ---------------------------------------------------------
   2. Quotes — QuoteSlate, then DummyJSON, then a local list
   Two independent live sources are tried in order before
   giving up and showing a saved quote. If one API is down,
   rate-limited, or has a CORS problem, the other can usually
   still answer — the widget only needs one of them to work.
   --------------------------------------------------------- */

var QUOTE_SOURCES = [
  {
    name: 'QuoteSlate',
    url: 'https://quoteslate.vercel.app/api/quotes/random',
    parse: function (data) { return { text: data.quote, author: data.author }; }
  },
  {
    name: 'DummyJSON',
    url: 'https://dummyjson.com/quotes/random',
    parse: function (data) { return { text: data.quote, author: data.author }; }
  }
];

var FALLBACK_QUOTES = [
  { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { content: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { content: 'Your limitation—it’s only your imagination.', author: 'Unknown' },
  { content: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { content: 'Great things never come from comfort zones.', author: 'Unknown' }
];

function initQuoteWidget() {
  var display = document.getElementById('quote-display');
  var refreshBtn = document.getElementById('quote-refresh');
  if (!display || !refreshBtn) return;

  loadQuote();
  refreshBtn.addEventListener('click', loadQuote);

  async function loadQuote() {
    refreshBtn.disabled = true;
    display.innerHTML = '';
    var loading = document.createElement('p');
    loading.className = 'api-status';
    loading.textContent = 'Loading a quote…';
    display.appendChild(loading);

    // Try each live source in turn; the first one that answers wins.
    for (var i = 0; i < QUOTE_SOURCES.length; i++) {
      var source = QUOTE_SOURCES[i];
      try {
        var response = await fetch(source.url);
        if (!response.ok) {
          throw new Error(source.name + ' request failed (' + response.status + ')');
        }
        var data = await response.json();
        var parsed = source.parse(data);
        if (parsed.text) {
          renderQuote(parsed.text, parsed.author, false);
          refreshBtn.disabled = false;
          return;
        }
      } catch (err) {
        // This source failed — fall through and try the next one.
      }
    }

    // Both live sources failed — fall back to a local quote and say so.
    var pick = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    renderQuote(pick.content, pick.author, true);
    refreshBtn.disabled = false;
  }

  function renderQuote(text, author, isFallback) {
    display.innerHTML = '';

    var blockquote = document.createElement('blockquote');
    blockquote.className = 'quote-text';
    blockquote.textContent = '“' + text + '”';

    var cite = document.createElement('p');
    cite.className = 'quote-author';
    cite.textContent = '— ' + (author || 'Unknown');

    display.appendChild(blockquote);
    display.appendChild(cite);

    if (isFallback) {
      var note = document.createElement('p');
      note.className = 'api-status api-status--error';
      note.textContent = 'Couldn’t reach either quotes API — showing a saved quote instead.';
      display.appendChild(note);
    }
  }
}
