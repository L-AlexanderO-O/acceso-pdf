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

/* ===== VARIABLES VISOR ===== */
let pdfDoc = null;
let paginaActual = 1;

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

/* ===== VALIDACIÓN ===== */
function validar() {
  const mensaje = document.getElementById("mensaje");

  if (estaBloqueado()) {
    mensaje.innerText =
      "Acceso bloqueado por 10 minutos por intentos fallidos.";
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const p1 = document.getElementById("p1").value.trim();
  const p2 = document.getElementById("p2").value.trim();
  const p3 = document.getElementById("p3").value.trim();

  const r1 = "Damiano David";
  const r2 = "5/4/08";
  const r3 = "El Mentalista";

  if (!nombre || !correo || !p1 || !p2 || !p3) {
    registrar(nombre, correo, "❌ Campos incompletos");
    mensaje.innerText = "Debes completar todos los campos.";
    return;
  }

  if (p1 === r1 && p2 === r2 && p3 === r3) {
    registrar(nombre, correo, "✅ Acceso permitido");

    localStorage.removeItem("intentosFallidos");
    localStorage.removeItem("bloqueoHasta");

    document.getElementById("formulario").classList.add("hidden");
    document.getElementById("pdf").classList.remove("hidden");

    document.getElementById("bienvenida").innerText =
      `Bienvenido/a ${nombre}`;
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
    paginaActual = 1;
    renderPagina("next");

    setTimeout(() => {
      cargando.classList.add("hidden");
      document.getElementById("bienvenida").classList.add("hidden");
    }, 600);
  });
}

/* ===== RENDER PÁGINA ===== */
function renderPagina(direccion) {
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

    canvas.className = `pagina ${
      direccion === "next" ? "flip-next" : "flip-prev"
    }`;

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

/* ===== CLICK SOLO EN PDF (PC) ===== */
const visor = document.getElementById("pdf-viewer");

visor.addEventListener("click", e => {
  if (!pdfDoc) return;

  const mitad = visor.clientWidth / 2;

  if (e.offsetX > mitad && paginaActual < pdfDoc.numPages) {
    paginaActual++;
    renderPagina("next");
  } else if (e.offsetX <= mitad && paginaActual > 1) {
    paginaActual--;
    renderPagina("prev");
  }
});

/* ===== SWIPE MÓVIL ===== */
let inicioX = 0;

visor.addEventListener("touchstart", e => {
  inicioX = e.touches[0].clientX;
});

visor.addEventListener("touchend", e => {
  if (!pdfDoc) return;

  const finX = e.changedTouches[0].clientX;
  const diff = inicioX - finX;

  if (Math.abs(diff) > 50) {
    if (diff > 0 && paginaActual < pdfDoc.numPages) {
      paginaActual++;
      renderPagina("next");
    } else if (diff < 0 && paginaActual > 1) {
      paginaActual--;
      renderPagina("prev");
    }
  }
});

/* ===== CERRAR PDF ===== */
function cerrarPDF() {
  document.getElementById("pdf").classList.add("hidden");
  document.getElementById("formulario").classList.remove("hidden");
  document.getElementById("pdf-viewer").innerHTML = "";
  pdfDoc = null;
}
