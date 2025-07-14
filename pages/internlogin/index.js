const API_BASE_URL = "http://192.168.0.66:3000/api";
const INTERN_LIST_URL = `${API_BASE_URL}/internList`;
const EDIT_INTERN_URL = id => `http://192.168.0.66:3000/editIntern/${encodeURIComponent(id)}`;
const DELETE_INTERN_URL = name => `http://192.168.0.66:3000/deleteIntern/${encodeURIComponent(name)}`;

const form = document.getElementById("user-registry");
const searchBar = document.getElementById("search-bar");
const listContainer = document.getElementById("list");
const backButton = document.getElementById('back-button');
const timeEl = document.getElementById("curr-time");

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
    const res = await fetch(INTERN_LIST_URL);
    if (!res.ok) throw new Error("Fetch failed");
    return await res.json();
  } catch (err) {
    console.error("getInternList:", err);
  }
}

async function updateInternList(data, reRender = true) {
  try {
    const res = await fetch(INTERN_LIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Update failed");
    if (reRender) renderInterns(await getInternList());
  } catch (err) {
    console.error("updateInternList:", err);
  }
}

async function editIntern(id, updates, reRender = true) {
  try {
    const res = await fetch(EDIT_INTERN_URL(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Edit failed");
    if (reRender) renderInterns(await getInternList());
  } catch (err) {
    console.error("editIntern:", err);
  }
}

async function deleteIntern(name, reRender = true) {
  try {
    const res = await fetch(DELETE_INTERN_URL(name), { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    if (reRender) renderInterns(await getInternList());
  } catch (err) {
    console.error("deleteIntern:", err);
  }
}


function renderInterns(interns) {
  listContainer.innerHTML = "";
  Object.entries(interns).forEach(([name, info]) => {
    const div = document.createElement("div");
    div.className = "person";
    const userStatus = info.status === "Time-In" ? "Time-out" : "Time-In";

    div.innerHTML = `
      <div class="person-top">
        <p>${info.honorifics || "Mr."} ${info["full name"]} ${info.suffix || ""}</p>
        <p>${info.totalHours || "0"} Hours</p>
      </div>
      <div class="person-bottom">
        <p>${info.address || "No address"}</p>
        <button class="Time" data-id="${name}" data-status="${info.status || "Time-Out"}">${userStatus}</button>
      </div>`;

    div.addEventListener("click", e => {
      if (e.target.classList.contains("Time")) return;
      handleInternSelect(name, interns[name]);
    });

    listContainer.appendChild(div);
  });
}

function renderTime() {
  if (timeEl) timeEl.textContent = moment().format("hh:mm A");
}

function handleInternSelect(name, intern) {
  if (selectedIntern === name) {
    selectedIntern = null;
    form.reset();
    toggleCrudButtons(false);
    return;
  }

  selectedIntern = name;
  form.honorifics.value = intern.honorifics || "Mr.";
  form.suffix.value = intern.suffix || "";
  form["full name"].value = name;
  form.email.value = intern.email || "";
  form.address.value = intern.address || "";
  toggleCrudButtons(true);
}

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

  updateBtn.style.display = deleteBtn.style.display = show ? "inline-block" : "none";

  updateBtn.onclick = async () => {
    await editIntern(selectedIntern, Object.fromEntries(new FormData(form).entries()));
    form.reset();
    toggleCrudButtons(false);
    selectedIntern = null;
  };

  deleteBtn.onclick = async () => {
    if (confirm(`Delete ${selectedIntern}?`)) {
      await deleteIntern(selectedIntern);
      form.reset();
      toggleCrudButtons(false);
      selectedIntern = null;
    }
  };
}


listContainer.addEventListener("click", e => {
  if (e.target.classList.contains("Time")) {
    ipcRenderer.send("open-time-window", e.target.dataset.id);
  }
});

form.addEventListener("submit", e => {
  e.preventDefault();
  pendingFormData = Object.fromEntries(new FormData(form).entries());
  ipcRenderer.send("open-confirm-window");
});

backButton.addEventListener("click", () => {
  window.location.href = "../sessionpage/sessionPage.html";
});

searchBar.addEventListener("input", async () => {
  const term = searchBar.value.toLowerCase();
  const interns = await getInternList();
  if (!interns) return;
  const filtered = Object.fromEntries(
    Object.entries(interns).filter(([_id, intern]) =>
      intern["full name"].toLowerCase().includes(term)
    )
  );
  renderInterns(filtered);
});

document.addEventListener("click", e => {
  if (!form.contains(e.target) && !listContainer.contains(e.target)) {
    selectedIntern = null;
    form.reset();
    toggleCrudButtons(false);
  }
});


ipcRenderer.once('barcode-scanned', async (_e, scannedName) => {
  if (!pendingFormData || isWaitingForBarcode) return;
  isWaitingForBarcode = false;

  const data = { ...pendingFormData, barcode: scannedName, honorifics: "Mr.", suffix: "", status: "Time-In" };
  pendingFormData = null;

  if (!data.timeIn && !data.timeOut) {
    data.logs = { timeIn: moment().format("hh:mm a"), timeOut: "" };
  }

  if (selectedIntern && selectedIntern !== data["full name"]) {
    await deleteIntern(selectedIntern, false);
    await updateInternList(data, false);
    renderInterns(await getInternList());
  } else if (selectedIntern) {
    await editIntern(selectedIntern, data);
  } else {
    await updateInternList(data);
  }

  form.reset();
  toggleCrudButtons(false);
  selectedIntern = null;
});

ipcRenderer.on('toggle-time', async (_e, scannedCode) => {
  try {
    const interns = await getInternList();
    const intern = interns?.[scannedCode];
    if (!intern) return;

    const isTimeIn = intern.status === "Time-In";
    const newStatus = isTimeIn ? "Time-Out" : "Time-In";
    const now = moment().format("hh:mm a");
    const updates = { status: newStatus, [isTimeIn ? "timeOut" : "timeIn"]: now };

    await editIntern(scannedCode, updates, false);
    renderInterns(await getInternList());
  } catch (err) {
    console.error("toggle-time error:", err);
  }
});
