/* ===== CONFIG ===== */
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwihXjpvnumyOohddh3pQMEri_83Y3mmknWsXSz929Ru4oJ3vyr6lX8RWw2KpPBEEDksw/exec";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const urlPDF = "documento.pdf";
const MAX_INTENTOS = 3;
const BLOQUEO_MINUTOS = 10;
const DURACION_SESION = 24 * 60 * 60 * 1000;

let pdfDoc = null;
let paginaActual = 1;

/* ===== UTILIDADES ===== */
function correoValido(c) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
}

function normalizarTexto(t) {
  return t.trim().toLowerCase().replace(/\s+/g, " ");
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
  const s = localStorage.getItem("sesionDocumento");
  if (!s) return null;
  const d = JSON.parse(s);
  if (Date.now() > d.expira) {
    localStorage.removeItem("sesionDocumento");
    return null;
  }
  return d;
}

function cerrarSesion() {
  localStorage.removeItem("sesionDocumento");
}

/* ===== BLOQUEO ===== */
function estaBloqueado() {
  const h = localStorage.getItem("bloqueoHasta");
  if (!h) return false;
  if (Date.now() > Number(h)) {
    localStorage.removeItem("bloqueoHasta");
    localStorage.removeItem("intentosFallidos");
    return false;
  }
  return true;
}

function registrarFallo() {
  let i = Number(localStorage.getItem("intentosFallidos")) || 0;
  i++;
  localStorage.setItem("intentosFallidos", i);
  if (i >= MAX_INTENTOS) {
    localStorage.setItem(
      "bloqueoHasta",
      Date.now() + BLOQUEO_MINUTOS * 60000
    );
  }
}

/* ===== MENSAJES SELECT ===== */
function verificarP4() {
  const v = p4.value;
  msg_p4.innerText = v === "si" ? "Idiota" : v === "no" ? "Cobarde" : "";
  msg_p4.style.color = v === "si" ? "red" : "orange";
}

function verificarP5() {
  const v = p5.value;
  msg_p5.innerText =
    v === "si" ? "No... no me conoces" : v === "no" ? "Pues lo harás" : "";
  msg_p5.style.color = v === "si" ? "red" : "green";
}

/* ===== VALIDAR ===== */
function validar() {
  if (estaBloqueado()) {
    mensaje.innerText = "Acceso bloqueado temporalmente.";
    return;
  }

  const nombre = nombre_i.value.trim();
  const correo = correo_i.value.trim();

  if (!nombre || !correo || !p1.value || !p2.value || !p3.value || !p4.value || !p5.value) {
    mensaje.innerText = "Completa TODOS los campos.";
    return;
  }

  if (!correoValido(correo)) {
    mensaje.innerText = "Correo inválido.";
    return;
  }

  if (
    normalizarTexto(p1.value) === normalizarTexto("Damiano David") &&
    p2.value === "5/4/08" &&
    normalizarTexto(p3.value) === normalizarTexto("El Mentalista")
  ) {
    guardarSesion(nombre, correo);
    formulario.classList.add("hidden");
    pdf.classList.remove("hidden");
    bienvenida.innerText = `Bienvenido, ${nombre}`;
    bienvenida.classList.remove("hidden");
    cargarPDF();
  } else {
    registrarFallo();
    mensaje.innerText = "Respuestas incorrectas.";
  }
}

/* ===== PDF ===== */
function cargarPDF() {
  cargando.classList.remove("hidden");
  pdfjsLib.getDocument(urlPDF).promise.then(pdf => {
    pdfDoc = pdf;
    paginaActual = Number(localStorage.getItem("ultimaPaginaDocumento")) || 1;
    renderPagina();
    cargando.classList.add("hidden");
  });
}

function renderPagina() {
  pdf_viewer.innerHTML = "";
  pdfDoc.getPage(paginaActual).then(page => {
    const viewport = page.getViewport({ scale: 1.3 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    page.render({ canvasContext: ctx, viewport });
    pdf_viewer.appendChild(canvas);
  });
}

function guardarPaginaActual() {
  localStorage.setItem("ultimaPaginaDocumento", paginaActual);
}

function paginaSiguiente() {
  if (paginaActual < pdfDoc.numPages) {
    paginaActual++;
    guardarPaginaActual();
    renderPagina();
  }
}

function paginaAnterior() {
  if (paginaActual > 1) {
    paginaActual--;
    guardarPaginaActual();
    renderPagina();
  }
}

function cerrarPDF() {
  guardarPaginaActual();
  cerrarSesion();
  location.reload();
}

/* ===== AUTOLOGIN ===== */
window.onload = () => {
  const s = obtenerSesion();
  if (s) {
    formulario.classList.add("hidden");
    pdf.classList.remove("hidden");
    bienvenida.innerText = `Bienvenido, ${s.nombre}`;
    bienvenida.classList.remove("hidden");
    cargarPDF();
  }
};
