const API_URL = "http://127.0.0.1:8000/analyze";

async function injectAndScrape(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { action: "scrape" }, (response) => {
      resolve(response?.reviews || []);
    });
  });
}

document.getElementById("analyze-btn").addEventListener("click", async () => {
  const btn = document.getElementById("analyze-btn");
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const noReviews = document.getElementById("no-reviews");

  btn.disabled = true;
  btn.textContent = "Analyzing...";
  loading.classList.remove("hidden");
  results.classList.add("hidden");
  noReviews.classList.add("hidden");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const reviews = await injectAndScrape(tab.id);

    if (reviews.length === 0) {
      loading.classList.add("hidden");
      noReviews.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Analyze Reviews";
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviews })
    });

    const data = await res.json();

    const scoreEl = document.getElementById("score-number");
    scoreEl.textContent = data.trust_score + "%";
    scoreEl.className = "score-number " +
      (data.trust_score >= 70 ? "score-high" :
       data.trust_score >= 40 ? "score-mid" : "score-low");

    const bar = document.getElementById("bar-fill");
    bar.style.width = data.trust_score + "%";
    bar.style.background =
      data.trust_score >= 70 ? "#22c55e" :
      data.trust_score >= 40 ? "#f59e0b" : "#ef4444";

    document.getElementById("total-reviews").textContent = data.total_reviews;
    document.getElementById("fake-count").textContent = data.fake_count;
    document.getElementById("confidence").textContent =
      `Model confidence: ${data.confidence}%`;

    const flagsEl = document.getElementById("flags");
    flagsEl.innerHTML = data.flags.map(f =>
      `<div class="flag">⚠️ ${f}</div>`
    ).join("");

    loading.classList.add("hidden");
    results.classList.remove("hidden");
    btn.disabled = false;
    btn.textContent = "Re-analyze";

  } catch (err) {
    console.error(err);
    loading.classList.add("hidden");
    btn.disabled = false;
    btn.textContent = "Analyze Reviews";
    alert("Error: " + err.message);
  }
});