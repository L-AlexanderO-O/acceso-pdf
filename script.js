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

/* ===== DETECTAR MÓVIL ===== */
function esMovil() {
  return window.innerWidth <= 768;
}

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
      Date.now() + BLOQUEO_MINUTOS * 60000
    );
  }
}

/* ===== PREGUNTAS SELECCIÓN ===== */
function verificarP4() {
  const v = document.getElementById("p4").value;
  const m = document.getElementById("msg-p4");
  m.style.fontWeight = "bold";

  if (!v) return (m.innerText = "");

  if (v === "si") {
    m.innerText = "Idiota";
    m.style.color = "red";
  } else {
    m.innerText = "Cobarde";
    m.style.color = "orange";
  }
}

function verificarP5() {
  const v = document.getElementById("p5").value;
  const m = document.getElementById("msg-p5");
  m.style.fontWeight = "bold";

  if (!v) return (m.innerText = "");

  if (v === "si") {
    m.innerText = "No... no me conoces";
    m.style.color = "red";
  } else {
    m.innerText = "Pues lo harás";
    m.style.color = "green";
  }
}

/* ===== VALIDACIÓN ===== */
function validar() {
  const mensaje = document.getElementById("mensaje");

  if (estaBloqueado()) {
    const t = tiempoRestanteBloqueo();
    mensaje.innerText =
      `Acceso bloqueado. Intenta en ${t.minutos}m ${t.segundos}s`;
    return;
  }

  const nombre = nombre.value.trim();
  const correo = correo.value.trim();
  const p1 = document.getElementById("p1").value.trim();
  const p2 = document.getElementById("p2").value.trim();
  const p3 = document.getElementById("p3").value.trim();
  const p4 = document.getElementById("p4").value;
  const p5 = document.getElementById("p5").value;

  if (!nombre || !correo || !p1 || !p2 || !p3 || !p4 || !p5) {
    registrar(nombre, correo, "❌ Campos incompletos");
    mensaje.innerText = "Debes completar todos los campos.";
    return;
  }

  if (!correoValido(correo)) {
    mensaje.innerText = "Correo no válido.";
    return;
  }

  if (
    normalizarTexto(p1) === normalizarTexto("Damiano David") &&
    p2 === "5/4/08" &&
    normalizarTexto(p3) === normalizarTexto("El Mentalista")
  ) {
    registrar(nombre, correo, "✅ Acceso permitido");
    localStorage.removeItem("intentosFallidos");
    localStorage.removeItem("bloqueoHasta");
    guardarSesion(nombre, correo);

    formulario.classList.add("hidden");
    pdf.classList.remove("hidden");
    bienvenida.innerText = `Bienvenido/a ${nombre}`;
    bienvenida.classList.remove("hidden");

    cargarPDF();
  } else {
    registrarFallo();
    registrar(nombre, correo, "❌ Acceso denegado");
    mensaje.innerText = "Respuestas incorrectas.";
  }
}

/* ===== REGISTRO ===== */
function registrar(nombre, correo, resultado) {
  fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ nombre, correo, resultado })
  });
}

/* ===== CARGAR PDF ===== */
function cargarPDF() {
  cargando.classList.remove("hidden");

  pdfjsLib.getDocument(urlPDF).promise.then(pdf => {
    pdfDoc = pdf;
    const guardada = Number(localStorage.getItem("ultimaPaginaDocumento"));
    paginaActual = guardada || 1;
    renderPagina();
    cargando.classList.add("hidden");
    bienvenida.classList.add("hidden");
  });
}

/* ===== RENDER ===== */
function renderPagina() {
  const cont = document.getElementById("pdf-viewer");
  cont.innerHTML = "";

  const paginas = esMovil() ? 1 : 2;

  for (let i = 0; i < paginas; i++) {
    const num = paginaActual + i;
    if (num > pdfDoc.numPages) break;

    pdfDoc.getPage(num).then(page => {
      const base = page.getViewport({ scale: 1 });
      const escala = esMovil()
        ? Math.min(innerWidth / base.width, innerHeight / base.height)
        : Math.min(innerWidth / (base.width * 2), innerHeight / base.height);

      const vp = page.getViewport({ scale: escala });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = vp.width;
      canvas.height = vp.height;

      page.render({ canvasContext: ctx, viewport: vp }).promise.then(() => {
        ctx.globalAlpha = 0.12;
        ctx.font = "32px Arial";
        ctx.rotate(-0.3);
        ctx.fillText("Documento confidencial", 40, canvas.height / 2);
        ctx.rotate(0.3);
        ctx.globalAlpha = 1;
      });

      cont.appendChild(canvas);
    });
  }
}

/* ===== CLICK ===== */
pdfViewer.addEventListener("click", e => {
  const salto = esMovil() ? 1 : 2;
  const mitad = innerWidth / 2;

  if (e.clientX > mitad && paginaActual + salto <= pdfDoc.numPages) {
    paginaActual += salto;
  } else if (e.clientX <= mitad && paginaActual - salto >= 1) {
    paginaActual -= salto;
  }

  guardarPaginaActual();
  renderPagina();
});

/* ===== SWIPE ===== */
let startX = 0;
pdfViewer.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

pdfViewer.addEventListener("touchend", e => {
  const diff = startX - e.changedTouches[0].clientX;
  const salto = esMovil() ? 1 : 2;

  if (Math.abs(diff) > 40) {
    if (diff > 0 && paginaActual + salto <= pdfDoc.numPages) {
      paginaActual += salto;
    }
    if (diff < 0 && paginaActual - salto >= 1) {
      paginaActual -= salto;
    }
    guardarPaginaActual();
    renderPagina();
  }
});

/* ===== CERRAR ===== */
function cerrarPDF() {
  cerrarSesion();
  pdf.classList.add("hidden");
  formulario.classList.remove("hidden");
  pdfViewer.innerHTML = "";
  pdfDoc = null;
}

/* ===== GUARDAR PÁGINA ===== */
function guardarPaginaActual() {
  localStorage.setItem("ultimaPaginaDocumento", paginaActual);
}

/* ===== AUTOLOGIN ===== */
window.addEventListener("load", () => {
  const sesion = obtenerSesion();
  if (sesion) {
    formulario.classList.add("hidden");
    pdf.classList.remove("hidden");
    cargarPDF();
  }
});
