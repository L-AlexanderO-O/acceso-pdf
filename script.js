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
let renderizando = false;

let tiempoInicio = null;
let tiempoTotal = 0;
let tiempoPagina = {};
let documentoLeido = false;

let bloqueoInterval = null;
let touchInicioX = 0;

/* ===== UTILIDADES ===== */
function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

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
      pagina: paginaActual,
      expira: Date.now() + DURACION_SESION
    })
  );
}

function obtenerSesion() {
  const s = localStorage.getItem("sesionDocumento");
  if (!s) return null;

  const datos = JSON.parse(s);
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
    clearInterval(bloqueoInterval);
    return false;
  }
  return true;
}

function iniciarContadorBloqueo() {
  const mensaje = document.getElementById("mensaje");
  bloqueoInterval = setInterval(() => {
    const restante = Number(localStorage.getItem("bloqueoHasta")) - Date.now();
    if (restante <= 0) {
      clearInterval(bloqueoInterval);
      mensaje.innerText = "";
    } else {
      const m = Math.floor(restante / 60000);
      const s = Math.floor((restante % 60000) / 1000);
      mensaje.innerText = `Acceso bloqueado. Intenta en ${m}m ${s}s`;
    }
  }, 1000);
}

function registrarFallo() {
  let intentos = Number(localStorage.getItem("intentosFallidos")) || 0;
  intentos++;
  localStorage.setItem("intentosFallidos", intentos);

  if (intentos >= MAX_INTENTOS) {
    localStorage.setItem(
      "bloqueoHasta",
      Date.now() + BLOQUEO_MINUTOS * 60000
    );
    iniciarContadorBloqueo();
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

/* ===== VALIDAR ACCESO ===== */
function validar() {
  const mensaje = document.getElementById("mensaje");
  if (estaBloqueado()) {
    iniciarContadorBloqueo();
    return;
  }

  const nombre = nombreInput.value.trim();
  const correo = correoInput.value.trim();
  const p1 = p1Input.value.trim();
  const p2 = p2Input.value.trim();
  const p3 = p3Input.value.trim();

  if (!nombre || !correo || !p1 || !p2 || !p3) {
    mensaje.innerText = "Completa todos los campos.";
    return;
  }

  if (!correoValido(correo)) {
    mensaje.innerText = "Correo inválido.";
    return;
  }

  if (
    normalizarTexto(p1) === "damiano david" &&
    p2 === "5/4/08" &&
    normalizarTexto(p3) === "el mentalista"
  ) {
    registrar(nombre, correo, "✅ Acceso permitido");
    localStorage.removeItem("intentosFallidos");
    localStorage.removeItem("bloqueoHasta");
    guardarSesion(nombre, correo);

    formulario.classList.add("hidden");
    pdf.classList.remove("hidden");
    cargarPDF();
  } else {
    registrarFallo();
    registrar(nombre, correo, "❌ Acceso denegado");
    mensaje.innerText = "Respuesta incorrecta.";
  }
}

/* ===== PDF ===== */
function cargarPDF() {
  const sesion = obtenerSesion();
  if (sesion?.pagina) paginaActual = sesion.pagina;

  pdfjsLib.getDocument(urlPDF).promise.then(pdf => {
    pdfDoc = pdf;
    tiempoInicio = Date.now();
    renderPagina();
  });
}

function renderPagina() {
  if (!pdfDoc || renderizando) return;
  renderizando = true;

  const contenedor = document.getElementById("pdf-viewer");
  contenedor.innerHTML = "";

  pdfDoc.getPage(paginaActual).then(page => {
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      const sesion = obtenerSesion();
      const nombre = sesion?.nombre || "INVITADO";

      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.textAlign = "center";
      ctx.font = "bold 36px Arial";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-0.35);
      ctx.fillText(nombre.toUpperCase(), 0, 0);
      ctx.fillText("DOCUMENTO CONFIDENCIAL", 0, 50);
      ctx.restore();

      contenedor.appendChild(canvas);
      renderizando = false;

      guardarSesion(nombre, sesion.correo);

      contadorPagina.innerText = `Página ${paginaActual} / ${pdfDoc.numPages}`;

      if (paginaActual === pdfDoc.numPages && !documentoLeido) {
        documentoLeido = true;
        guardarTiempoPagina();
        contenedor.classList.add("hidden");
        evaluacion.classList.remove("hidden");
      }
    });
  });
}

/* ===== NAVEGACIÓN ===== */
pdfViewer.addEventListener("click", e => {
  guardarTiempoPagina();
  if (e.clientX > window.innerWidth / 2 && paginaActual < pdfDoc.numPages)
    paginaActual++;
  else if (paginaActual > 1) paginaActual--;
  renderPagina();
});

pdfViewer.addEventListener("touchstart", e => {
  touchInicioX = e.touches[0].clientX;
});

pdfViewer.addEventListener("touchend", e => {
  const diff = touchInicioX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) {
    guardarTiempoPagina();
    if (diff > 0 && paginaActual < pdfDoc.numPages) paginaActual++;
    if (diff < 0 && paginaActual > 1) paginaActual--;
    renderPagina();
  }
});

/* ===== TIEMPO ===== */
function guardarTiempoPagina() {
  if (!tiempoInicio) return;
  const ahora = Date.now();
  tiempoTotal += ahora - tiempoInicio;
  tiempoInicio = ahora;
}

/* ===== FINALIZAR ===== */
function finalizarLectura() {
  const sesion = obtenerSesion();
  const min = Math.floor(tiempoTotal / 60000);
  const seg = Math.floor((tiempoTotal % 60000) / 1000);

  registrar(
    sesion.nombre,
    sesion.correo,
    `📘 LEÍDO | ${min}m ${seg}s | Última pág: ${paginaActual}`
  );

  alert("Lectura finalizada");
  cerrarSesion();
  location.reload();
}

/* ===== AUTOLOGIN ===== */
window.addEventListener("load", () => {
  const sesion = obtenerSesion();
  if (sesion) {
    formulario.classList.add("hidden");
    pdf.classList.remove("hidden");
    cargarPDF();
  }
  if (estaBloqueado()) iniciarContadorBloqueo();
});

