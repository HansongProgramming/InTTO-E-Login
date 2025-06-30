const API_BASE_URL = "http://192.168.0.87:3000/api";
const INTERN_LIST_URL = `${API_BASE_URL}/internList`;

const form = document.getElementById("user-registry");
const searchBar = document.getElementById("search-bar");
const listContainer = document.getElementById("list");
const backButton = document.getElementById('back-button');

const { ipcRenderer } = require("electron");


let selectedIntern = null;
let pendingFormData = null;
let isWaitingForBarcode = false;

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

async function updateInternList(data, reRender = true) {
  try {
    const response = await fetch(INTERN_LIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to update intern list");

    console.log("Intern list updated successfully");

    if (reRender) {
      const interns = await getInternList();
      if (interns) renderInterns(interns);
    }
  } catch (err) {
    console.error("Error updating intern list:", err);
  }
}

async function editIntern(id, updates, reRender = true) {
  try {
    const response = await fetch(
      `http://192.168.0.87:3000/editIntern/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) throw new Error("Failed to edit intern");

    console.log(`Intern '${id}' updated successfully`);

    if (reRender) {
      const interns = await getInternList();
      if (interns) renderInterns(interns);
    }
  } catch (err) {
    console.error("Error editing intern:", err);
  }
}



async function deleteIntern(fullName, reRender = true) {
  try {
    const encodedName = encodeURIComponent(fullName);
    const response = await fetch(
      `http://192.168.0.87:3000/deleteIntern/${encodedName}`,
      { method: "DELETE" }
    );

    if (!response.ok) throw new Error("Failed to delete intern");

    console.log(`Intern '${fullName}' deleted successfully`);

    if (reRender) {
      const interns = await getInternList();
      if (interns) renderInterns(interns);
    }
  } catch (err) {
    console.error("Error deleting intern:", err);
  }
}

function renderInterns(interns) {
  listContainer.innerHTML = "";

  Object.entries(interns).forEach(([name, info]) => {
    const personDiv = document.createElement("div");
    personDiv.className = "person";

    const userStatus = info.status === "Time-In" ? "Time-out" : "Time-In";

    personDiv.innerHTML = `
      <div class="person-top">
        <p>${info.honorifics || "Mr."} ${info["full name"]} ${info.suffix || ""}</p>
        <p>${info.totalHours || "0"} Hours</p>
      </div>
      <div class="person-bottom">
        <p>${info.address || "No address"}</p>
        <button 
          class="Time" 
          data-id="${name}" 
          data-status="${info.status || "Time-Out"}">
          ${userStatus}
        </button>
      </div>
    `;

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
    const internId = button.dataset.id;
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
      await editIntern(internId, updates, false);
      console.log(`Updated user: ${internId}`);

      const interns = await getInternList();
      if (interns) renderInterns(interns);
    } catch (err) {
      console.error(err);
    }
  }
});


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  pendingFormData = data;

  ipcRenderer.send("open-confirm-window");
});

backButton.addEventListener('click', () => {
  window.location.href = '../sessionpage/sessionPage.html';
});

searchBar.addEventListener("input", async () => {
  const searchTerm = searchBar.value.toLowerCase();

  const interns = await getInternList();
  if (!interns) return;

  const filtered = Object.fromEntries(
    Object.entries(interns).filter(([name]) =>
      name.toLowerCase().includes(searchTerm)
    ));

  renderInterns(filtered);
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

ipcRenderer.once('barcode-scanned', async (_event, scannedName) => {
  // console.log('barcode-scanned triggered', { pendingFormData, isWaitingForBarcode });
  if (!pendingFormData || isWaitingForBarcode) return;

  console.log('Passed check for', scannedName);
  isWaitingForBarcode = false;

  const data = pendingFormData;
  pendingFormData = null;

  data.barcode = scannedName;
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

  const newName = data["full name"];

  if (selectedIntern) {
    console.log('test1')
    if (selectedIntern !== newName) {
      await deleteIntern(selectedIntern, false);
      await updateInternList(data, false);

      const interns = await getInternList();
      renderInterns(interns);
    } else {
      await editIntern(selectedIntern, data);
    }
      selectedIntern = null;
  } else {
    console.log('test2')
    console.log(data);
    await updateInternList(data);
  }

  form.reset();
  toggleCrudButtons(false);
});