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
const DURACION_SESION = 24 * 60 * 60 * 1000; // 1 día

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

  const minutos = Math.floor(restanteMs / 60000);
  const segundos = Math.floor((restanteMs % 60000) / 1000);

  return { minutos, segundos };
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

/* ===== PREGUNTAS SELECCIÓN MÚLTIPLE (MENSAJES) ===== */
function verificarP4() {
  const valor = document.getElementById("p4").value;
  const msg = document.getElementById("msg-p4");

  msg.style.fontWeight = "bold";

  if (!valor) {
    msg.innerText = "";
    return;
  }

  if (valor === "si") {
    msg.innerText = "Idiota";
    msg.style.color = "red";
  } else {
    msg.innerText = "Cobarde";
    msg.style.color = "orange";
  }
}

function verificarP5() {
  const valor = document.getElementById("p5").value;
  const msg = document.getElementById("msg-p5");

  msg.style.fontWeight = "bold";

  if (!valor) {
    msg.innerText = "";
    return;
  }

  if (valor === "si") {
    msg.innerText = "No... no me conoces";
    msg.style.color = "red";
  } else {
    msg.innerText = "Pues lo harás";
    msg.style.color = "green";
  }
}

/* ===== VALIDACIÓN PRINCIPAL ===== */
function validar() {
  const mensaje = document.getElementById("mensaje");

  if (estaBloqueado()) {
    const tiempo = tiempoRestanteBloqueo();
    mensaje.innerText =
      Acceso bloqueado. Intenta nuevamente en ${tiempo.minutos} min ${tiempo.segundos} s.;
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const p1 = document.getElementById("p1").value.trim();
const p2 = document.getElementById("p2").value.trim();
const p3 = document.getElementById("p3").value.trim();
const p4 = document.getElementById("p4").value;
const p5 = document.getElementById("p5").value;

  const r1 = "Damiano David";
  const r2 = "5/4/08";
  const r3 = "El Mentalista";

  if (!nombre || !correo || !p1 || !p2 || !p3 || !p4 || !p5) {
  registrar(nombre, correo, "❌ Campos incompletos");
  mensaje.innerText =
    "Debes completar todos los campos, incluidas las preguntas de selección.";
  return;
}

  if (!correoValido(correo)) {
    mensaje.innerText = "Ingresa un correo electrónico válido.";
    return;
  }

  if (
    normalizarTexto(p1) === normalizarTexto(r1) &&
    p2 === r2 &&
    normalizarTexto(p3) === normalizarTexto(r3)
  ) {
    registrar(nombre, correo, "✅ Acceso permitido");

    localStorage.removeItem("intentosFallidos");
    localStorage.removeItem("bloqueoHasta");
    guardarSesion(nombre, correo);

    document.getElementById("formulario").classList.add("hidden");
    document.getElementById("pdf").classList.remove("hidden");

    document.getElementById("bienvenida").innerText =
      Bienvenido/a ${nombre};
    document.getElementById("bienvenida").classList.remove("hidden");

    cargarPDF();
  } else {
    registrarFallo();
    registrar(nombre, correo, "❌ Acceso denegado");
    mensaje.innerText =
      "Respuesta incorrecta. Tras 3 intentos se bloqueará.";
  }
}

/* ===== REGISTRO GOOGLE SHEETS ===== */
function registrar(nombre, correo, resultado) {
  fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ nombre, correo, resultado })
  });
}

/* ===== CARGAR PDF ===== */
function cargarPDF() {
  const cargando = document.getElementById("cargando");
  cargando.classList.remove("hidden");

  pdfjsLib.getDocument(urlPDF).promise.then(pdf => {
    pdfDoc = pdf;
    const guardada = Number(localStorage.getItem("ultimaPaginaDocumento"));
paginaActual = guardada && guardada > 0 ? guardada : 1;
renderPagina();
    cargando.classList.add("hidden");
    document.getElementById("bienvenida").classList.add("hidden");
  });
}

/* ===== RENDER PÁGINA ===== */
function renderPagina() {
  const contenedor = document.getElementById("pdf-viewer");
  contenedor.innerHTML = "";

  pdfDoc.getPage(paginaActual).then(page => {
    const base = page.getViewport({ scale: 1 });
    const escala = Math.min(
      window.innerWidth / base.width,
      window.innerHeight / base.height
    );

    const viewport = page.getViewport({ scale: escala });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      ctx.globalAlpha = 0.12;
      ctx.font = "40px Arial";
      ctx.fillStyle = "black";
      ctx.rotate(-0.3);
      ctx.fillText("Documento confidencial", 50, canvas.height / 2);
      ctx.rotate(0.3);
      ctx.globalAlpha = 1;
    });

    contenedor.appendChild(canvas);
  });
}

/* ===== CLICK PC ===== */
document.getElementById("pdf-viewer").addEventListener("click", e => {
  if (!pdfDoc) return;

  const mitad = window.innerWidth / 2;
  if (e.clientX > mitad && paginaActual < pdfDoc.numPages) {
  paginaActual++;
  guardarPaginaActual();
  renderPagina();
} else if (e.clientX <= mitad && paginaActual > 1) {
  paginaActual--;
  guardarPaginaActual();
  renderPagina();
}
});

/* ===== SWIPE MÓVIL ===== */
let touchInicioX = 0;

document.getElementById("pdf-viewer").addEventListener("touchstart", e => {
  touchInicioX = e.touches[0].clientX;
});

document.getElementById("pdf-viewer").addEventListener("touchend", e => {
  if (!pdfDoc) return;

  const diff = touchInicioX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) {
    let cambio = false;

if (diff > 0 && paginaActual < pdfDoc.numPages) {
  paginaActual++;
  cambio = true;
}

if (diff < 0 && paginaActual > 1) {
  paginaActual--;
  cambio = true;
}

if (cambio) {
  guardarPaginaActual();
  renderPagina();
}
  }
});

/* ===== CERRAR PDF ===== */
function cerrarPDF() {
  cerrarSesion();
  document.getElementById("pdf").classList.add("hidden");
  document.getElementById("formulario").classList.remove("hidden");
  document.getElementById("pdf-viewer").innerHTML = "";
  pdfDoc = null;
}

/* ===== AUTOLOGIN ===== */
window.addEventListener("load", () => {
  const sesion = obtenerSesion();
  if (sesion) {
    document.getElementById("formulario").classList.add("hidden");
    document.getElementById("pdf").classList.remove("hidden");
    cargarPDF();
  }
});

/*====ultimaPaginaDocumento====*/

function guardarPaginaActual() {
  if (!pdfDoc) return;
  localStorage.setItem("ultimaPaginaDocumento", paginaActual);
}

