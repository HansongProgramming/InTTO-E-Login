const listContainer = document.getElementById("list");
const searchBar = document.getElementById("search-bar");
const morphPath = document.getElementById("morphPath");
const backButton = document.getElementById("admin-back-button");
const visitorCount = document.getElementById("visitor-count");
const visitorCountSubtitle = document.getElementById("visitor-count-subtitle");
const internCount = document.getElementById("intern-count");
const guestCount = document.getElementById("guest-count");
const barChartFilterType = document.getElementById("filter-type");

const API_BASE_URL = "http://192.168.0.88:3000/api";
const INTERN_LIST_URL = `${API_BASE_URL}/internList`;
const GUEST_LIST_URL = `${API_BASE_URL}/guestList`;

Chart.defaults.backgroundColor = "#64E4B1";
let barChartInstance;

const chartContexts = {
  bar: document.getElementById("myBarChart").getContext("2d"),
  visitorCategory: document.getElementById("visitorCategory").getContext("2d"),
  returningVsNew: document.getElementById("returningVsNew").getContext("2d"),
  officeActivity: document.getElementById("officeActivity").getContext("2d"),
};

async function createBarChart(ctx, formatType = "daily", rawData) {

  const { labels, data } = generateChartData(formatType, rawData);

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Number of Visitors",
        data,
        borderWidth: 1,
      }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#ffffff" },
          title: { display: true, text: "Visitor Count", color: "#ffffff" },
        },
        x: {
          title: { display: true, text: getXLabel(formatType), color: "#ffffff" },
          ticks: { color: "#ffffff" },
        },
      },
      plugins: {
        legend: { labels: { color: "#ffffff" } },
        title: { color: "#ffffff" },
      },
    },
  });
}


async function createDoughnutChart(ctx, title, labels, data, colors) {
  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors || generateColors(labels.length),
        borderWidth: 0,
      }],
    },
    options: {
      maintainAspectRatio: false,
      cutout: 70,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#ffffff" },
        },
        title: {
          display: true,
          text: title,
          color: "#ffffff",
        },
      },
    },
  });
}

async function generateCharts() {
  const interns = await getInternList();
  const guests = await getGuestList();

  const internListLength = Object.keys(interns || {}).length;
  const guestsListLength = Object.keys(guests || {}).length;

  const returningVisitors = internListLength;
  const newVisitors = guestsListLength;

  const internship = internListLength;
  const tbiAssessment = 3;
  const justVisiting = guestsListLength;

  barChartInstance = await createBarChart(chartContexts.bar, "daily");

  await createDoughnutChart(
    chartContexts.visitorCategory,
    "Visitor Statistics",
    ["Guests", "Interns"],
    [guestsListLength, internListLength]
  );

  await createDoughnutChart(
    chartContexts.returningVsNew,
    "Returning vs New",
    ["Returning", "New"],
    [returningVisitors, newVisitors]
  );

  await createDoughnutChart(
    chartContexts.officeActivity,
    "Office Activity",
    ["Intern", "TBI", "Visiting"],
    [internship, tbiAssessment, justVisiting]
  );
}


async function getInternList() {
  try {
    const response = await fetch(INTERN_LIST_URL);
    if (!response.ok) throw new Error("Failed to fetch intern list");
    return await response.json();
  } catch (err) {
    console.error("Error fetching intern list:", err);
  }
}
async function getGuestList() {
  try {
    const response = await fetch(GUEST_LIST_URL);
    if (!response.ok) throw new Error("Failed to fetch guest list");
    return await response.json();
  } catch (err) {
    console.error("Error fetching guest list:", err);
  }
}
async function setupOfficeTimeline() {
  const interns = await getInternList();
  const guests = await getGuestList();

  const internListLength = Object.keys(interns).length;
  const guestsListLength = Object.keys(guests).length;
  const totalLength = internListLength + guestsListLength;

  visitorCount.textContent = totalLength;
  visitorCountSubtitle.textContent = totalLength > 1 ? "Visitors Today" : "Visitor Today";

  internCount.textContent = `${internListLength} ${internListLength === 1 ? 'Intern' : 'Interns'}`;
  guestCount.textContent = `${guestsListLength} ${guestsListLength === 1 ? 'Guest' : 'Guests'}`;
}

function renderInterns(interns) {
  listContainer.innerHTML = "";

  Object.entries(interns).forEach(([_, info]) => {
    const personDiv = document.createElement("div");
    personDiv.className = "person";

    personDiv.innerHTML = `
      <div class="person-top">
        <p>${info.honorifics || "Mr."} ${info["full name"]} ${info.suffix || ""}</p>
        <p>${(info.logs?.[info.logs.length - 1]?.date) || "N/A"}</p>
        <p>In: ${(info.logs?.[info.logs.length - 1]?.timeIn) || "N/A"}</p>
        <p>Out: ${(info.logs?.[info.logs.length - 1]?.timeOut) || "N/A"}</p>
      </div>
      <div class="person-bottom">
        <p>${info.address || "No address"}</p>
        <p>${info.email}</p>
      </div>
    `;

    listContainer.appendChild(personDiv);
  });
}

function renderTime() {
  const timeEl = document.getElementById("curr-time");
  if (timeEl) {
    timeEl.textContent = moment().format("hh:mm A");
  }
}

function generateColors(count) {
  const defaultColors = ["#64E4B1", "#008650", "#49C981"];
  return defaultColors.slice(0, count);
}

function generateChartData(type, rawData) {
  switch (type) {
    case "daily":
      return {
        labels: ["8:00", "9:00", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"],
        data: rawData?.hourlyCounts || [15, 5, 7, 20, 30, 20, 5, 2, 5, 10],
      };

    case "weekly":
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        data: rawData?.dailyCounts || [50, 60, 40, 70, 90, 30, 20],
      };

    case "monthly":
      return {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        data: rawData?.monthlyCounts || Array.from({ length: 30 }, () => Math.floor(Math.random() * 100)),
      };

    default:
      return { labels: [], data: [] };
  }
}


function getXLabel(type) {
  switch (type) {
    case "daily": return "Time of Day";
    case "weekly": return "Day of the Week";
    case "monthly": return "Day of the Month";
    default: return "";
  }
}


searchBar.addEventListener("input", async () => {
  const searchTerm = searchBar.value.toLowerCase();
  const interns = await getInternList();
  if (!interns) return;

  const filtered = Object.fromEntries(
    Object.entries(interns).filter(([_, intern]) =>
      intern["full name"].toLowerCase().includes(searchTerm)
    )
  );

  renderInterns(filtered);
});

barChartFilterType.addEventListener("change", async (e) => {
  const type = e.target.value;

  if (barChartInstance) {
    barChartInstance.destroy();
  }

  barChartInstance = await createBarChart(chartContexts.bar, type);
})


const d1 = `M15 1.25H199C206.87 1.25 213.25 7.62994 213.25 15.5V40C213.25 48.6985 220.302 55.75 229 55.75H634C641.87 55.75 648.25 62.1299 648.25 70V517C648.25 524.87 641.87 531.25 634 531.25H15C7.12994 531.25 0.75 524.87 0.75 517V15.5C0.750003 7.62995 7.12995 1.25 15 1.25Z`;

const d2 = `M225.5 0.75H340.5C348.37 0.75 354.75 7.12994 354.75 15V39.5C354.75 48.1985 361.802 55.25 370.5 55.25H634C641.87 55.25 648.25 61.6299 648.25 69.5V516.5C648.25 524.37 641.87 530.75 634 530.75H15C7.12994 530.75 0.75 524.37 0.75 516.5V69.5C0.75 61.6299 7.12994 55.25 15 55.25H195.5C204.198 55.25 211.25 48.1985 211.25 39.5V15C211.25 7.12994 217.63 0.75 225.5 0.75Z`;

function animateMorph(from, to, duration = 80) {
  const interpolator = flubber.interpolate(from, to);
  let startTime = null;

  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);

    morphPath.setAttribute("d", interpolator(t));

    if (t < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}


function setupTabs() {
  const tab1Btn = document.querySelector(".tab1");
  const tab2Btn = document.querySelector(".tab2");
  const doughnutContainer = document.querySelector(".admin-data-tab1");
  const barContainer = document.querySelector(".admin-data-tab2");

  let currentTab = "tab1";

  const toggleTab = (tab) => {
    tab1Btn.classList.toggle("active", tab === "tab1");
    tab2Btn.classList.toggle("active", tab === "tab2");
    doughnutContainer.classList.toggle("active", tab === "tab1");
    barContainer.classList.toggle("active", tab === "tab2");
  };

  tab1Btn.addEventListener("click", () => {
    if (currentTab !== "tab1") {
      animateMorph(d2, d1);
      currentTab = "tab1";
      toggleTab("tab1");
    }
  });

  tab2Btn.addEventListener("click", () => {
    if (currentTab !== "tab2") {
      animateMorph(d1, d2);
      currentTab = "tab2";
      toggleTab("tab2");
    }
  });

  toggleTab("tab1");
}

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  backButton.addEventListener("click", () => {
    window.location.href = "../sessionpage/sessionPage.html";
  });
});

window.onload = async () => {
  const interns = await getInternList();
  if (interns) renderInterns(interns);

  renderTime();
  setupOfficeTimeline();
  generateCharts();

  setInterval(renderTime, 15000);
};
