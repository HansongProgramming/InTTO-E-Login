const { ipcRenderer } = require('electron');

const listContainer = document.getElementById("list");
const searchBar = document.getElementById("search-bar");
const morphPath = document.getElementById("morphPath");
const backButton = document.getElementById("admin-back-button");
const visitorCount = document.getElementById("visitor-count");
const visitorCountSubtitle = document.getElementById("visitor-count-subtitle");
const internCount = document.getElementById("intern-count");
const guestCount = document.getElementById("guest-count");
const barChartFilterType = document.getElementById("filter-type");

const exportInternButton = document.getElementById("export-intern-button");
const exportGuestButton = document.getElementById("export-guest-button");
const exportDataButton = document.getElementById("export-data-button");

const createEventButton = document.getElementById("create-event");

const API_BASE_URL = "http://127.0.0.1:3000/api";
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

  const isMale = (honorific) => honorific?.toLowerCase() === "mr.";
  const isFemale = (honorific) =>
    ["ms.", "mrs."].includes(honorific?.toLowerCase());

  const allPeople = [...Object.values(interns), ...Object.values(guests)];

  const maleCount = allPeople.filter(person => isMale(person.honorifics)).length;
  const femaleCount = allPeople.filter(person => isFemale(person.honorifics)).length;

  const tbiAssessment = Object.values(guests).filter(guest =>
    guest.address?.toLowerCase().includes("tbi")
  ).length;
  const justVisiting = guestsListLength - tbiAssessment;

  const rawData = {
     logs: [
      ...extractLogsFromData(interns),
      ...extractLogsFromData(guests)
     ] 
  };

  barChartInstance = await createBarChart(
    chartContexts.bar, "daily", rawData
  ); 

  await createDoughnutChart(
    chartContexts.visitorCategory,
    "Visitor Statistics",
    ["Guests", "Interns"],
    [guestsListLength, internListLength]
  );

  await createDoughnutChart(
    chartContexts.returningVsNew,
    "Male vs Female",
    ["Male", "Female"],
    [maleCount, femaleCount]
  );

  await createDoughnutChart(
    chartContexts.officeActivity,
    "Office Activity",
    ["Intern", "TBI", "Visiting"],
    [internListLength, tbiAssessment, justVisiting]
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

async function exportDataToCSV(dataType) {
  let rawData;

  if (dataType === "interns") {
    rawData = await getInternList();
  } else if (dataType === "guests") {
    rawData = await getGuestList();
  } else {
    console.error("Invalid data type");
    return;
  }

  const rows = [];

  for (const id in rawData) {
    const entry = rawData[id];
    const logs = entry.logs || [];

    logs.forEach(log => {
      if (!isDateInCurrentWeek(log.date)) return;

      rows.push({
        ID: id,
        "Full Name": `${entry.honorifics || ""} ${entry["full name"]}`.trim(),
        Email: entry.email,
        Address: entry.address,
        Status: entry.status,
        "Total Hours": entry.totalHours ?? "",
        Date: log.date,
        "Time In": log.timeIn || "",
        "Time Out": log.timeOut || ""
      });
    });
  }

  if (rows.length === 0) {
    const existingError = document.querySelector(".search");
    const errorEl = document.createElement("p");
    
    if (errorEl) errorEl.remove();
    errorEl.className = "error-message";
    errorEl.textContent =  "No Logs.";
    errorEl.style.textAlign = "center";
    errorEl.style.color = "red";

    search.appendChild(errorEl);
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(field => `"${(row[field] ?? "").toString().replace(/"/g, '""')}"`).join(",")
    )
  ];

  const csvContent = csvRows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${dataType}_log_export.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportChartDataToXLSX() {
  const XLSX = require("xlsx");

  const workbook = XLSX.utils.book_new();

  const chartTypes = ["daily", "weekly", "monthly", "yearly"];
  const allLogs = {
    logs: [
      ...extractLogsFromData(await getInternList()),
      ...extractLogsFromData(await getGuestList())
    ]
  };

  for (const type of chartTypes) {
    const { labels, data } = generateChartData(type, allLogs);
    const rows = labels.map((label, i) => ({
      Label: label,
      "Visitor Count": data[i]
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, `${type}_BarChart`);
  }

  const interns = await getInternList();
  const guests = await getGuestList();

  const internListLength = Object.keys(interns || {}).length;
  const guestsListLength = Object.keys(guests || {}).length;

  const allPeople = [...Object.values(interns), ...Object.values(guests)];
  const maleCount = allPeople.filter(p => (p.honorifics || "").toLowerCase() === "mr.").length;
  const femaleCount = allPeople.filter(p => ["ms.", "mrs."].includes((p.honorifics || "").toLowerCase())).length;

  const tbiAssessment = Object.values(guests).filter(g =>
    g.address?.toLowerCase().includes("tbi")
  ).length;
  const justVisiting = guestsListLength - tbiAssessment;

  const doughnutData = [
    {
      sheet: "Visitor_Category",
      labels: ["Guests", "Interns"],
      values: [guestsListLength, internListLength]
    },
    {
      sheet: "Male_vs_Female",
      labels: ["Male", "Female"],
      values: [maleCount, femaleCount]
    },
    {
      sheet: "Office_Activity",
      labels: ["Intern", "TBI", "Visiting"],
      values: [internListLength, tbiAssessment, justVisiting]
    }
  ];

  doughnutData.forEach(chart => {
    const rows = chart.labels.map((label, i) => ({
      Category: label,
      Count: chart.values[i]
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, chart.sheet);
  });

  // Write to binary string
  const workbookBinary = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array" // Important: write as array buffer
  });

  const blob = new Blob([workbookBinary], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "All_Charts_Export.xlsx";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isDateInCurrentWeek(dateStr) {
  const now = new Date();
  const inputDate = new Date(dateStr);
  
  const day = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return inputDate >= monday && inputDate <= sunday;
}

function renderGuests(guests) {
  listContainer.innerHTML = "";

  Object.entries(guests).forEach(([_, info]) => {
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
  const logs = rawData?.logs || [];

  const parseTime = (str) => {
    const [time, modifier] = str.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "pm" && hours !== 12) hours += 12;
    if (modifier === "am" && hours === 12) hours = 0;

    return hours + minutes / 60;
  };

  if (!Array.isArray(logs)) console.error("Invalid data format!!");

  switch (type) {
    case "daily":
      const hourBuckets = new Array(10).fill(0);
      logs.forEach((log) => {
        if(log.timeIn) {
          const hour = Math.floor(parseTime(log.timeIn));
          const index = hour - 8;
          if (index >= 0 && index < hourBuckets.length) {
            hourBuckets[index]++;
          }
        }
      });
      return {
        labels: ["8:00", "9:00", "10:00", "11:00", "12:00", "1:00", "2:00", "3:00", "4:00", "5:00"],
        data: hourBuckets
      };

    case "weekly":
      const weeklyMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayCounts = new Array(7).fill(0);
      logs.forEach((log) => {
        const day = new Date(log.date).toLocaleDateString("en-US", {weekday: "short"});
        const index = weeklyMap[day];
        if (index != null) dayCounts[index]++;
      });
      return { labels: days, data: dayCounts };

    case "monthly":
      const monthlyDayCounts = Array.from({ length: 31 }, () => 0);
      logs.forEach(log => {
        const date = new Date(log.date);
        const day = date.getDate();
        monthlyDayCounts[day - 1]++;
      });
      return {
        labels: monthlyDayCounts.map((_, i) => `Day ${i + 1}`),
        data: monthlyDayCounts
      };

    case "yearly":
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthCounts = new Array(12).fill(0);
      logs.forEach(log => {
        const date = new Date(log.date);
        const month = date.getMonth();
        monthCounts[month]++;
      });
      return {
        labels: monthNames,
        data: monthCounts
      };

    default:
      return { labels: [], data: [] };
  }
}

function extractLogsFromData(dataObject) {
  return Object.values(dataObject).flatMap(entry =>
    (entry.logs || []).map(log => ({
      date: log.date,
      timeIn: log.timeIn
    }))
  ).filter(log => log.date && log.timeIn); // Filter out incomplete logs
}

function getXLabel(type) {
  switch (type) {
    case "daily": return "Time of Day";
    case "weekly": return "Day of the Week";
    case "monthly": return "Day of the Month";
    case "yearly": return "Month of the Year";
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
  const rawData = {
    logs: [
      ...extractLogsFromData(await getInternList()),
      ...extractLogsFromData(await getGuestList())
    ]
  };

  barChartInstance = await createBarChart(chartContexts.bar, type, rawData);
})

exportInternButton.addEventListener("click", async () => exportDataToCSV("interns"));
exportGuestButton.addEventListener("click", async () => exportDataToCSV("guests"));
exportDataButton.addEventListener("click", async () => exportChartDataToXLSX());

createEventButton.addEventListener("click", () => {
  const eventContainer = document.getElementById("event-name");
  const eventName = eventContainer.value.trim();
  if (!eventName) {
    const existingError = document.querySelector(".events-container");
    const errorEl = document.createElement("p");
    
    if (errorEl) errorEl.remove();
    errorEl.className = "error-message";
    errorEl.textContent = "Please Enter an Event.";
    errorEl.style.textAlign = "center";
    errorEl.style.color = "red";

    existingError.appendChild(errorEl);
    return;
  } else {
    window.location.href = `../guestlogin/guestlogin.html?event=${encodeURIComponent(eventName)}`;
  }
});


const d1 = `M15 1.25H199C206.87 1.25 213.25 7.62994 213.25 15.5V40C213.25 48.6985 220.302 55.75 229 55.75H634C641.87 55.75 648.25 62.1299 648.25 70V517C648.25 524.87 641.87 531.25 634 531.25H15C7.12994 531.25 0.75 524.87 0.75 517V15.5C0.750003 7.62995 7.12995 1.25 15 1.25Z`;
const d2 = `M225.5 0.75H340.5C348.37 0.75 354.75 7.12994 354.75 15V39.5C354.75 48.1985 361.802 55.25 370.5 55.25H634C641.87 55.25 648.25 61.6299 648.25 69.5V516.5C648.25 524.37 641.87 530.75 634 530.75H15C7.12994 530.75 0.75 524.37 0.75 516.5V69.5C0.75 61.6299 7.12994 55.25 15 55.25H195.5C204.198 55.25 211.25 48.1985 211.25 39.5V15C211.25 7.12994 217.63 0.75 225.5 0.75Z`;
const d3 = `M374.5 0.75H473.5C481.37 0.75 487.75 7.12994 487.75 15V39.5C487.75 48.1985 494.802 55.25 503.5 55.25H634C641.87 55.25 648.25 61.6299 648.25 69.5V516.5C648.25 524.37 641.87 530.75 634 530.75H15C7.12994 530.75 0.75 524.37 0.75 516.5V69.5C0.75 61.6299 7.12994 55.25 15 55.25H344.5C353.198 55.25 360.25 48.1985 360.25 39.5V15C360.25 7.12994 366.63 0.75 374.5 0.75Z`;

function animateMorph(from, to, duration = 80) {
  const interpolator = flubber.interpolate(from, to);
  let startTime = null;

  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const t = Math.min(elapsed / duration, 1);
    morphPath.setAttribute("d", interpolator(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function setupTabs() {
  const tab1Btn = document.querySelector(".tab1");
  const tab2Btn = document.querySelector(".tab2");
  const tab3Btn = document.querySelector(".tab3");

  const tab1Content = document.querySelector(".admin-data-tab1");
  const tab2Content = document.querySelector(".admin-data-tab2");
  const tab3Content = document.querySelector(".admin-data-tab3");

  let currentTab = "tab1";

  const toggleTab = (tab) => {
    tab1Btn.classList.toggle("active", tab === "tab1");
    tab2Btn.classList.toggle("active", tab === "tab2");
    tab3Btn.classList.toggle("active", tab === "tab3");

    tab1Content.classList.toggle("active", tab === "tab1");
    tab2Content.classList.toggle("active", tab === "tab2");
    tab3Content.classList.toggle("active", tab === "tab3");
  };

  tab1Btn.addEventListener("click", () => {
    if (currentTab !== "tab1") {
      animateMorph(currentTab === "tab2" ? d2 : d3, d1);
      currentTab = "tab1";
      toggleTab("tab1");
    }
  });

  tab2Btn.addEventListener("click", () => {
    if (currentTab !== "tab2") {
      animateMorph(currentTab === "tab1" ? d1 : d3, d2);
      currentTab = "tab2";
      toggleTab("tab2");
    }
  });

  tab3Btn.addEventListener("click", () => {
    if (currentTab !== "tab3") {
      animateMorph(currentTab === "tab1" ? d1 : d2, d3);
      currentTab = "tab3";
      toggleTab("tab3");
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
  const guests = await getGuestList();
  if (guests) renderGuests(guests);

  renderTime();
  setupOfficeTimeline();
  generateCharts();

  setInterval(renderTime, 15000);
};