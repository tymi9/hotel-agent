// Guest page: weather strip and the message form.

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=41.39&longitude=2.17" +
  "&daily=temperature_2m_max,precipitation_probability_max&timezone=Europe%2FMadrid&forecast_days=7";

async function showWeather() {
  const list = document.getElementById("weather");
  try {
    const data = await (await fetch(WEATHER_URL)).json();
    const d = data.daily;
    list.innerHTML = "";
    d.time.forEach((date, i) => {
      // date is "YYYY-MM-DD"; noon avoids time-zone surprises
      const label = new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
      });
      const li = document.createElement("li");
      li.innerHTML =
        '<span class="day"></span><span class="temp"></span><span class="rain"></span>';
      li.querySelector(".day").textContent = i === 0 ? "Today" : label;
      li.querySelector(".temp").textContent = Math.round(d.temperature_2m_max[i]) + "°";
      li.querySelector(".rain").textContent = d.precipitation_probability_max[i] + "% rain";
      list.appendChild(li);
    });
  } catch {
    list.innerHTML = '<li class="muted">The forecast is not available right now.</li>';
  }
}

const form = document.getElementById("form");
const replyBox = document.getElementById("reply");
const sendButton = document.getElementById("send");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  sendButton.disabled = true;
  sendButton.textContent = "Sending…";
  replyBox.hidden = false;
  replyBox.textContent = "One moment, please.";

  try {
    const res = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        message: form.message.value,
      }),
    });
    const data = await res.json();
    replyBox.textContent = data.reply || data.error;
  } catch {
    replyBox.textContent = "Sorry, we could not send your message. Please try again in a moment.";
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send";
  }
});

// Clear: empty the message and the reply; keep name and e-mail.
document.getElementById("clear").addEventListener("click", () => {
  form.message.value = "";
  replyBox.textContent = "";
  replyBox.hidden = true;
  form.message.focus();
});

showWeather();
