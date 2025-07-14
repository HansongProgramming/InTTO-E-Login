const API_BASE_URL = "http://192.168.0.66:3000/api";
const GUEST_LIST_URL = `${API_BASE_URL}/guestList`;

const form = document.getElementById("user-registry");
const searchBar = document.getElementById("search-bar");
const listContainer = document.getElementById("list");
const toggleButton = document.getElementById("toggle-status");
const backButton = document.getElementById('back-button');

let selectedIntern = null;

window.onload = async () => {
  const guests = await getGuestList();
  console.log(guests);
  if (guests) renderGuests(guests);
  renderTime();

  setInterval(renderTime, 15000);
};

async function getGuestList() {
  try {
    const response = await fetch(GUEST_LIST_URL);
    if (!response.ok) throw new Error("Failed to fetch intern list");
    return await response.json();
  } catch (err) {
    console.error("Error fetching intern list:", err);
  }
}

async function updateGuestList(data, reRender = true) {
  try {
    const response = await fetch(GUEST_LIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to update intern list"); 

    console.log("Guest list updated successfully");

    if (reRender) {
      const guests = await getGuestList();
      if (guests) renderGuests(guests);
    }
  } catch (err) {
    console.error("Error updating guest list:", err);
  }
}

async function editIntern(fullName, updates, reRender = true) {
  try {
    const encodedName = encodeURIComponent(fullName);
    const response = await fetch(
      `http://192.168.0.66:3000/editIntern/${encodedName}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) throw new Error("Failed to edit intern");

    console.log(`Intern '${fullName}' updated successfully`);

    if (reRender) {
      const interns = await getGuestList();
      if (interns) renderGuests(interns);
    }
  } catch (err) {
    console.error("Error editing intern:", err);
  }
}

async function deleteIntern(fullName, reRender = true) {
  try {
    const encodedName = encodeURIComponent(fullName);
    const response = await fetch(
      `http://192.168.0.66:3000/deleteIntern/${encodedName}`,
      { method: "DELETE" }
    );

    if (!response.ok) throw new Error("Failed to delete intern");

    console.log(`Intern '${fullName}' deleted successfully`);

    if (reRender) {
      const interns = await getGuestList();
      if (interns) renderGuests(interns);
    }
  } catch (err) {
    console.error("Error deleting intern:", err);
  }
}

async function logInternHours(internName, timeIn, timeOut) {
  const date = moment().format("YYYY-MM-DD");

  const res = await fetch(`${API_BASE_URL}/hours/${encodeURIComponent(internName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      log: { date, timeIn, timeOut }
    }),
  });

  if (!res.ok) {
    console.error("Failed to log hours");
  } else {
    console.log("Hours logged successfully");
  }
}

function renderGuests(interns) {
  listContainer.innerHTML = "";

  Object.entries(interns).forEach(([name, info]) => {
    const personDiv = document.createElement("div");
    personDiv.className = "person";

    // const userStatus = info.status === "Time-In" ? "Time-out" : "Time-in";

    personDiv.innerHTML = `
      <div class="person-top">
        <p>${info.honorifics || "Mr."} ${info["full name"]} ${info.suffix || ""}</p>
        ${info.logs?.[info.logs.length - 1]?.timeIn || "N/A"}
      </div>
      <div class="person-bottom">
        <p>${info.address || "No address"}</p>
      </div>
    `;
    // <button 
    //   class="Time" 
    //   data-name="${name}" 
    //   data-status="${info.status || "Time-Out"}">
    //   ${userStatus}
    // </button>

    personDiv.addEventListener("click", async (e) => {
      if (e.target.classList.contains("Time")) return;

      if (selectedIntern === name) {
        selectedIntern = null;
        form.reset();
        toggleCrudButtons(false);
        return;
      }

      const intern = interns[name];
      selectedIntern = name;
      form.honorifics.value = intern.honorifics || "Mr.";
      form.suffix.value = intern.suffix || "";
      form["full name"].value = name;
      form.email.value = intern.email || "";
      form.address.value = intern.address || "";
      toggleCrudButtons(true);
    });

    listContainer.appendChild(personDiv);
  });
}

function renderTime() {
  const timeEl = document.getElementById("curr-time");

  if (timeEl) {
    const now = moment();
    timeEl.textContent = now.format("hh:mm A");
  }
}

listContainer.addEventListener("click", async (event) => {
  if (event.target.classList.contains("Time")) {
    const button = event.target;
    const intern = button.dataset.name;
    const currentStatus = button.dataset.status || "Time-Out";

    const isTimeIn = currentStatus === "Time-In";
    const newStatus = isTimeIn ? "Time-Out" : "Time-In";
    const now = moment().format("hh:mm a");

    const updates = { status: newStatus };
    if (!isTimeIn) {
      updates.timeIn = now;
    } else {
      updates.timeOut = now;
    }


    button.dataset.status = newStatus;
    button.textContent = newStatus === "Time-In" ? "Time-out" : "Time-in";

    try {
      await editIntern(intern, updates, false);
      console.log(`Updated user: ${intern}`);

      const internData = await getGuestList();
      const fullIntern = internData[intern];
      const timeIn = fullIntern?.timeIn;

      if (isTimeIn && timeIn) {
        await logInternHours(intern, timeIn, now);
      }
    } catch (err) {
      console.error(err);
    }
  }
});


form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  data.honorifics = data.honorifics || "Mr.";
  data.suffix = data.suffix || "";
  data.status = "Time-In";

  const now = moment().format("hh:mm a");

  if (!data.timeIn && !data.timeOut) {
    data.logs = {
      timeIn: now,
      timeOut: ""
    };
  }

  await updateGuestList(data);
  form.reset();
  toggleCrudButtons(false);
});

backButton.addEventListener('click', () => {
  window.location.href = '../sessionpage/sessionPage.html';
});

searchBar.addEventListener("input", async () => {
  const searchTerm = searchBar.value.toLowerCase();

  const interns = await getGuestList();
  if (!interns) return;

  const filtered = Object.fromEntries(
    Object.entries(interns).filter(([name]) =>
      name.toLowerCase().includes(searchTerm)
    ));

  renderGuests(filtered);
});

function toggleCrudButtons(show) {
  let updateBtn = document.getElementById("update-btn");
  let deleteBtn = document.getElementById("delete-btn");

  if (!updateBtn) {
    updateBtn = document.createElement("button");
    updateBtn.id = "update-btn";
    updateBtn.textContent = "Update Intern";
    updateBtn.type = "button";
    form.appendChild(updateBtn);
  }

  if (!deleteBtn) {
    deleteBtn = document.createElement("button");
    deleteBtn.id = "delete-btn";
    deleteBtn.textContent = "Delete Intern";
    deleteBtn.type = "button";
    deleteBtn.style.marginLeft = "10px";
    form.appendChild(deleteBtn);
  }

  updateBtn.style.display = show ? "inline-block" : "none";
  deleteBtn.style.display = show ? "inline-block" : "none";

  updateBtn.onclick = () => {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    editIntern(selectedIntern, data);
    form.reset();

    selectedIntern = null;
    toggleCrudButtons(false);
    selectedIntern = null;
  };

  deleteBtn.onclick = () => {
    if (confirm(`Are you sure you want to delete ${selectedIntern}?`)) {
      deleteIntern(selectedIntern);
      form.reset();
      toggleCrudButtons(false);
      selectedIntern = null;
    }
  };
}

document.addEventListener("click", (event) => {
  const isClickInsideForm = form.contains(event.target);
  const isClickInsideList = listContainer.contains(event.target);

  if (!isClickInsideForm && !isClickInsideList) {
    selectedIntern = null;
    form.reset();
    toggleCrudButtons(false);
  }
});