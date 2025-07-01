const listContainer = document.getElementById("list");
const searchBar = document.getElementById("search-bar");

const API_BASE_URL = "http://192.168.0.87:3000/api";
const INTERN_LIST_URL = `${API_BASE_URL}/internList`;

let myBarChart = document.getElementById("myBarChart").getContext("2d");
let vistorCategory = document
  .getElementById("visitorCategory")
  .getContext("2d");

let returningVsNew = document.getElementById("returningVsNew").getContext("2d");

let officeActivity = document.getElementById("officeActivity").getContext("2d");

Chart.defaults.backgroundColor = "#64E4B1";

let visitorTimeLine = new Chart(myBarChart, {
  type: "bar",
  data: {
    labels: [
      "8:00",
      "9:00",
      "10:00",
      "11:00",
      "12:00",
      "1:00",
      "2:00",
      "3:00",
      "4:00",
      "5:00",
    ],
    datasets: [
      {
        label: "Number of Visitors",
        data: [15, 5, 7, 20, 30, 20, 5, 2, 5, 10],
        borderWidth: 1,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#ffffff",
        },
        title: {
          display: true,
          color: "#ffffff",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time of Day",
          color: "#ffffff",
        },
        ticks: {
          color: "#ffffff",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
        },
      },
      title: {
        color: "#ffffff",
      },
    },
  },
});

let Visitor_category = new Chart(visitorCategory, {
  type: "doughnut",
  data: {
    labels: ["Guests", "Staff"],
    datasets: [
      {
        label: "Visitor Category",
        data: [100, 50],
        backgroundColor: ["#64E4B1", "#008650"],
        borderWidth: 0,
      },
    ],
  },
  options: {
    cutout: 70,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ffffff",
        },
      },
      title: {
        display: true,
        text: "Visitor Statistics",
        color: "#ffffff",
      },
    },
  },
});

let Returning_vs_New = new Chart(returningVsNew, {
  type: "doughnut",
  data: {
    labels: ["Guests", "Staff"],
    datasets: [
      {
        label: "Returning Vs New",
        data: [100, 50],
        backgroundColor: ["#64E4B1", "#008650"],
        borderWidth: 0,
      },
    ],
  },
  options: {
    cutout: 70,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ffffff",
        },
      },
      title: { display: true, text: "Returning Vs New", color: "#ffffff" },
    },
  },
});

let Office_Activity = new Chart(officeActivity, {
  type: "doughnut",
  data: {
    labels: ["Guests", "Staff"],
    datasets: [
      {
        label: "Office Activity",
        data: [100, 50],
        backgroundColor: ["#64E4B1", "#008650"],
        borderWidth: 0,
      },
    ],
  },
  options: {
    cutout: 70,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ffffff",
        },
      },
      title: { display: true, text: "Office Activity", color: "#ffffff" },
    },
  },
});

window.onload = async () => {
  const interns = await getInternList();
  if (interns) renderInterns(interns);
  renderTime();

  setInterval(renderTime, 15000);
};

async function getInternList() {
  try {
    const response = await fetch(INTERN_LIST_URL);
    if (!response.ok) throw new Error("Failed to fetch intern list");
    return await response.json();
  } catch (err) {
    console.error("Error fetching intern list:", err);
  }
}

async function exportCSV(data) {}

function renderInterns(interns) {
  listContainer.innerHTML = "";

  Object.entries(interns).forEach(([name, info]) => {
    const personDiv = document.createElement("div");
    personDiv.className = "person";

    personDiv.innerHTML = `
      <div class="person-top">
        <p>${info.honorifics || "Mr."} ${info["full name"]} ${
      info.suffix || ""
    }</p>
        <p>${info.logs[0].date}</p>
        <p>Time-in: ${info.logs[0].timeIn}</p>
      </div>
      <div class="person-bottom">
        <p>${info.address || "No address"}</p>
        <p>${info.email}</p>
      </div>
    `;

    listContainer.appendChild(personDiv);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const tab1Btn = document.querySelector(".tab1");
  const tab2Btn = document.querySelector(".tab2");
  const morphPath = document.getElementById("morphPath");
  const backButton = document.getElementById("admin-back-button");

  const d1 = `M15 1.25H199C206.87 1.25 213.25 7.62994 213.25 15.5V40C213.25 48.6985 220.302 55.75 229 55.75H634C641.87 55.75 648.25 62.1299 648.25 70V517C648.25 524.87 641.87 531.25 634 531.25H15C7.12994 531.25 0.75 524.87 0.75 517V15.5C0.750003 7.62995 7.12995 1.25 15 1.25Z`;

  const d2 = `M225.5 0.75H340.5C348.37 0.75 354.75 7.12994 354.75 15V39.5C354.75 48.1985 361.802 55.25 370.5 55.25H634C641.87 55.25 648.25 61.6299 648.25 69.5V516.5C648.25 524.37 641.87 530.75 634 530.75H15C7.12994 530.75 0.75 524.37 0.75 516.5V69.5C0.75 61.6299 7.12994 55.25 15 55.25H195.5C204.198 55.25 211.25 48.1985 211.25 39.5V15C211.25 7.12994 217.63 0.75 225.5 0.75Z`;

  let current = "tab1";

  const animateMorph = (from, to, duration = 800) => {
    const interpolator = flubber.interpolate(from, to);
    let frame = 0;
    const totalFrames = Math.round(duration / (6000 / 60));

    const step = () => {
      frame++;
      const t = frame / totalFrames;
      morphPath.setAttribute("d", interpolator(t));
      if (frame < totalFrames) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const toggleActiveTab = (tab) => {
    document.querySelectorAll(".admin-tabs button").forEach((btn) => {
      btn.classList.remove("active");
    });
    tab.classList.add("active");

    const doughnutContainer = document.querySelector(".admin-data-tab1");
    const barContainer = document.querySelector(".admin-data-tab2");

    if (tab.classList.contains("tab1")) {
      doughnutContainer.classList.add("active");
      barContainer.classList.remove("active");
    } else {
      doughnutContainer.classList.remove("active");
      barContainer.classList.add("active");
    }
  };

  tab1Btn.addEventListener("click", () => {
    if (current !== "tab1") {
      animateMorph(d2, d1);
      current = "tab1";
      toggleActiveTab(tab1Btn);
    }
  });

  tab2Btn.addEventListener("click", () => {
    if (current !== "tab2") {
      animateMorph(d1, d2);
      current = "tab2";
      toggleActiveTab(tab2Btn);
    }
  });

  backButton.addEventListener("click", () => {
    window.location.href = "../sessionpage/sessionPage.html";
  });

  searchBar.addEventListener("input", async () => {
    const searchTerm = searchBar.value.toLowerCase();

    const interns = await getInternList();
    if (!interns) return;

    const filtered = Object.fromEntries(
      Object.entries(interns).filter(([name]) =>
        name.toLowerCase().includes(searchTerm)
      )
    );

    renderInterns(filtered);
  });

  toggleActiveTab(tab1Btn);
});

function renderTime() {
  const timeEl = document.getElementById("curr-time");

  if (timeEl) {
    const now = moment();
    timeEl.textContent = now.format("hh:mm A");
  }
}
