let myBarChart = document.getElementById("myBarChart").getContext("2d");
let myDoughnutChart = document
  .getElementById("myDoughnutChart")
  .getContext("2d");

Chart.defaults.backgroundColor = "#64E4B1";

let barChart = new Chart(myBarChart, {
  type: "bar",
  data: {
    labels: [
      "8:00", "9:00", "10:00", "11:00", "12:00",
      "1:00", "2:00", "3:00", "4:00", "5:00",
    ],
    datasets: [{
      label: "Number of Visitors",
      data: [15, 5, 7, 20, 30, 20, 5, 2, 5, 10],
      borderWidth: 1,
    }],
   },
    options: {
      scales: {
        y: { beginAtZero: true },
        x: { title: { display: true, text: "Time of Day" } }
      },
    },
});

let doughnutChart = new Chart(myDoughnutChart, {
  type: "doughnut",
  data: {
    labels: ["Guests", "Staff"],
    datasets: [{
      label: "Visitor Category",
      data: [100, 50],
      backgroundColor: ["#64E4B1", "#008650"],
      borderWidth: 1,
    }],
  },
  options: {
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Visitor Statistics" },
    },
  },
});

async function exportCSV(data) {}

    document.addEventListener("DOMContentLoaded", () => {
      const tab1Btn = document.querySelector(".tab1");
      const tab2Btn = document.querySelector(".tab2");
      const morphPath = document.getElementById("morphPath");

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
        document.querySelectorAll(".admin-tabs button").forEach((btn) =>
          btn.classList.remove("active")
        );
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

      toggleActiveTab(tab1Btn);
    });