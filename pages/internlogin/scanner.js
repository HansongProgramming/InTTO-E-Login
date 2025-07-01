const { ipcRenderer } = require("electron");

const API_BASE_URL = "http://192.168.0.87:3000/api";
const INTERN_LIST_URL = `${API_BASE_URL}/internList`;

let scanning = true;

const quaggaConfig = {
  inputStream: {
    target: document.querySelector("#camera"),
    type: "LiveStream",
    constraints: {
      width: { min: 500 },
      height: { min: 350 },
      facingMode: "environment",
    },
  },
  decoder: {
    readers: ["code_39_reader"],
  },
  locate: true,
};

function startScanner() {
  Quagga.init(quaggaConfig, (err) => {
    if (err) {
      console.error("Quagga init failed:", err);
      return;
    }
    Quagga.start();
    scanning = true;
  });
}

Quagga.onDetected((res) => {
  if (!scanning) return;
  scanning = false;

  const code = res.codeResult.code;
  const resultDiv = document.querySelector("#result");

  setTimeout(() => {
    Quagga.stop();

    document.querySelector("#camera").style.display = "none";

    resultDiv.innerHTML = `
      <h1>Scanned: ${code}</h1>
      <h3>Confirm ID Number</h3>
      <button id='confirm-button'>Yes</button>
      <button id='reject-button'>No</button>
    `;
    resultDiv.style.display = "block";

    document
      .getElementById("confirm-button")
      .addEventListener("click", () => {
        const channel = "barcode-scanned";
        ipcRenderer.send(channel, code);
      });
    document
      .getElementById("reject-button")
      .addEventListener("click", () => {
        resultDiv.style.display = "none";
        document.querySelector("#camera").style.display = "block";
        startScanner();
      });
  }, 700);
});

document.addEventListener("DOMContentLoaded", async () => {
  startScanner();
});