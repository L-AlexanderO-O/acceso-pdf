/* ================= CONFIGURACIÓN ================= */

const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwihXjpvnumyOohddh3pQMEri_83Y3mmknWsXSz929Ru4oJ3vyr6lX8RWw2KpPBEEDksw/exec";

const PDF_URL = "documento.pdf";
const DURACION_SESION = 24 * 60 * 60 * 1000;

/* ================= ELEMENTOS DOM ================= */

const nombreInput = document.getElementById("nombre");
const correoInput = document.getElementById("correo");
const p1Input = document.getElementById("p1");
const p2Input = document.getElementById("p2");
const p3Input = document.getElementById("p3");

const formulario = document.getElementById("formulario");
const pdf = document.getElementById("pdf");
const pdfViewer = document.getElementById("pdf-viewer");
const contadorPagina = document.getElementById("contador-pagina");
const evaluacion = document.getElementById("evaluacion");

/* ================= VARIABLES ================= */

let pdfDoc = null;
let paginaActual = 1;
let totalPaginas = 0;

let tiempoInicio = null;
let tiempoTotal = 0;
let tiempoPagina = {};

/* ================= SESIÓN ================= */

function guardarSesion(nombre, correo) {
  localStorage.setItem(
    "sesionDocumento",
    JSON.stringify({
      nombre,
      correo,
      pagina: paginaActual,
      expira: Date.now() + DURACION_SESION,
    })
  );
}

function obtenerSesion() {
  const data = localStorage.getItem("sesionDocumento");
  if (!data) return null;

  const sesion = JSON.parse(data);
  if (Date.now() > sesion.expira) {
    localStorage.removeItem("sesionDocumento");
    return null;
  }
  return sesion;
}

/* ================= REGISTRO ================= */

function registrar(nombre, correo, resultado) {
  fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      nombre,
      correo,
      resultado,
      fecha: new Date().toLocaleString(),
    }),
  });
}

/* ================= TIEMPO ================= */

function iniciarTiempo() {
  tiempoInicio = Date.now();
}

function guardarTiempoPagina() {
  if (!tiempoInicio) return;

  const ahora = Date.now();
  const diff = ahora - tiempoInicio;

  tiempoTotal += diff;
  tiempoPagina[paginaActual] =
    (tiempoPagina[paginaActual] || 0) + diff;

  tiempoInicio = ahora;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    guardarTiempoPagina();
    tiempoInicio = null;
  } else {
    iniciarTiempo();
  }
});

/* ================= PDF ================= */

pdfjsLib.getDocument(PDF_URL).promise.then((doc) => {
  pdfDoc = doc;
  totalPaginas = doc.numPages;

  const sesion = obtenerSesion();
  if (sesion) paginaActual = sesion.pagina || 1;

  renderPagina(paginaActual);
});

function renderPagina(num) {
  guardarTiempoPagina();

  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    pdfViewer.innerHTML = "";
    pdfViewer.appendChild(canvas);

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      dibujarMarcaAgua(ctx, canvas);
      iniciarTiempo();
    });

    contadorPagina.textContent = `Página ${num} / ${totalPaginas}`;
    guardarSesion(obtenerSesion().nombre, obtenerSesion().correo);
  });
}

function dibujarMarcaAgua(ctx, canvas) {
  const sesion = obtenerSesion();
  if (!sesion) return;

  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.font = "40px Arial";
  ctx.fillStyle = "#000";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.fillText(sesion.nombre, -200, 0);
  ctx.restore();
}

/* ================= NAVEGACIÓN ================= */

pdfViewer.addEventListener("click", (e) => {
  const mitad = pdfViewer.clientWidth / 2;

  if (e.offsetX > mitad && paginaActual < totalPaginas) {
    paginaActual++;
  } else if (e.offsetX < mitad && paginaActual > 1) {
    paginaActual--;
  }

  if (paginaActual === totalPaginas) {
    finalizarLectura();
  } else {
    renderPagina(paginaActual);
  }
});

/* ================= LECTURA FINAL ================= */

function finalizarLectura() {
  guardarTiempoPagina();

  pdf.classList.add("hidden");
  evaluacion.classList.remove("hidden");
}

/* ================= EVALUACIÓN ================= */

function enviarEvaluacion() {
  const sesion = obtenerSesion();

  const min = Math.floor(tiempoTotal / 60000);
  const seg = Math.floor((tiempoTotal % 60000) / 1000);

  registrar(
    sesion.nombre,
    sesion.correo,
    JSON.stringify({
      estado: "LEÍDO",
      tiempo: `${min}m ${seg}s`,
      ultimaPagina: paginaActual,
      evaluacion: {
        p1: p1Input.value,
        p2: p2Input.value,
        p3: p3Input.value,
      },
    })
  );

  alert("Documento marcado como leído ✅");
  localStorage.removeItem("sesionDocumento");
  location.reload();
}

/* ================= FORMULARIO ================= */

formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = nombreInput.value.trim();
  const correo = correoInput.value.trim();

  guardarSesion(nombre, correo);

  formulario.classList.add("hidden");
  pdf.classList.remove("hidden");
});
