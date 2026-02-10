/* ===== URL DE GOOGLE APPS SCRIPT ===== */
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwihXjpvnumyOohddh3pQMEri_83Y3mmknWsXSz929Ru4oJ3vyr6lX8RWw2KpPBEEDksw/exec";

/* ===== CONFIGURACIÓN PDF.js ===== */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const urlPDF = "documento.pdf";

/* ===== CONFIG BLOQUEO ===== */
const MAX_INTENTOS = 3;
const BLOQUEO_MINUTOS = 10;

/* ===== CONFIG SESIÓN ===== */
const DURACION_SESION = 24 * 60 * 60 * 1000;

/* ===== VARIABLES ===== */
let pdfDoc = null;
let paginaActual = 1;

/* ===== VALIDAR CORREO ===== */
function correoValido(correo) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

/* ===== NORMALIZAR TEXTO ===== */
function normalizarTexto(texto) {
  return texto.trim().toLowerCase().replace(/\s+/g, " ");
}

/* ===== SESIÓN ===== */
function guardarSesion(nombre, correo) {
  localStorage.setItem(
    "sesionDocumento",
    JSON.stringify({
      nombre,
      correo,
      expira: Date.now() + DURACION_SESION
    })
  );
}

function obtenerSesion() {
  const sesion = localStorage.getItem("sesionDocumento");
  if (!sesion) return null;

  const datos = JSON.parse(sesion);
  if (Date.now() > datos.expira) {
    localStorage.removeItem("sesionDocumento");
    return null;
  }
  return datos;
}

function cerrarSesion() {
  localStorage.removeItem("sesionDocumento");
}

/* ===== BLOQUEO ===== */
function estaBloqueado() {
  const hasta = localStorage.getItem("bloqueoHasta");
  if (!hasta) return false;

  if (Date.now() > Number(hasta)) {
    localStorage.removeItem("bloqueoHasta");
    localStorage.removeItem("intentosFallidos");
    return false;
  }
  return true;
}

function tiempoRestanteBloqueo() {
  const hasta = localStorage.getItem("bloqueoHasta");
  if (!hasta) return null;

  const restanteMs = Number(hasta) - Date.now();
  if (restanteMs <= 0) return null;

  return {
    minutos: Math.floor(restanteMs / 60000),
    segundos: Math.floor((restanteMs % 60000) / 1000)
  };
}

function registrarFallo() {
  let intentos = Number(localStorage.getItem("intentosFallidos")) || 0;
  intentos++;
  localStorage.setItem("intentosFallidos", intentos);

  if (intentos >= MAX_INTENTOS) {
    localStorage.setItem(
      "bloqueoHasta",
      Date.now() + BLOQUEO_MINUTOS * 60 * 1000
    );
  }
}

/* ===== SELECCIÓN MÚLTIPLE ===== */
function verificarP4() {
  const valor = document.getElementById("p4").value;
  const msg = document.getElementById("msg-p4");

  msg.style.fontWeight = "bold";
  msg.innerText = valor === "si" ? "Idiota" : valor === "no" ? "Cobarde" : "";
  msg.style.color = valor === "si" ? "red" : "orange";
}

function verificarP5() {
  const valor = document.getElementById("p5").value;
  const msg = document.getElementById("msg-p5");

  msg.style.fontWeight = "bold";
  msg.innerText =
    valor === "si"
      ? "No... no me conoces"
      : valor === "no"
      ? "Pues lo harás"
      : "";
  msg.style.color = valor === "si" ? "red" : "green";
}

/* ===== VALIDACIÓN ===== */
function validar() {
  const mensaje = document.getElementById("mensaje");

  if (estaBloqueado()) {
    const t = tiempoRestanteBloqueo();
    mensaje.innerText = `Acceso bloqueado. Intenta en ${t.minutos} min ${t.segundos} s.`;
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const p1 = document.getElementById("p1").value.trim();
  const p2 = document.getElementById("p2").value.trim();
  const p3 = document.getElementById("p3").value.trim();
  const p4 = document.getElementById("p4").value;
  const p5 = document.getElementById("p5").value;

  if (!nombre || !correo || !p1 || !p2 || !p3 || !p4 || !p5) {
    mensaje.innerText =
      "Debes completar todos los campos, incluidas las preguntas de selección.";
    return;
  }

  if (!correoValido(correo)) {
    mensaje.innerText = "Correo electrónico inválido.";
    return;
  }

  if (
    normalizarTexto(p1) === normalizarTexto("Damiano David") &&
    p2 === "5/4/08" &&
    normalizarTexto(p3) === normalizarTexto("El Mentalista")
  ) {
    guardarSesion(nombre, correo);
    document.getElementById("formulario").classList.add("hidden");
    document.getElementById("pdf").classList.remove("hidden");
    cargarPDF();
  } else {
    registrarFallo();
    mensaje.innerText = "Respuestas incorrectas.";
  }
}

/* ===== PDF ===== */
function cargarPDF() {
  pdfjsLib.getDocument(urlPDF).promise.then(pdf => {
    pdfDoc = pdf;
    paginaActual =
      Number(localStorage.getItem("ultimaPaginaDocumento")) || 1;
    renderPagina();
  });
}

function renderPagina() {
  const contenedor = document.getElementById("pdf-viewer");
  contenedor.innerHTML = "";

  pdfDoc.getPage(paginaActual).then(page => {
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({ canvasContext: ctx, viewport });
    contenedor.appendChild(canvas);
  });
}

function guardarPaginaActual() {
  localStorage.setItem("ultimaPaginaDocumento", paginaActual);
}
