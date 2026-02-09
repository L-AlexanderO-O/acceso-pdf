/* ===== URL DE GOOGLE APPS SCRIPT ===== */
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwihXjpvnumyOohddh3pQMEri_83Y3mmknWsXSz929Ru4oJ3vyr6lX8RWw2KpPBEEDksw/exec";

/* ===== CONFIG PDF.js ===== */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const urlPDF = "documento.pdf";

/* ===== CONFIG BLOQUEO ===== */
const MAX_INTENTOS = 3;
const BLOQUEO_MINUTOS = 10;

/* ===== VARIABLES ===== */
let pdfDoc = null;
let paginaActual = 1;
let animando = false;

/* ===== BLOQUEO ===== */
function estaBloqueado() {
  const bloqueoHasta = localStorage.getItem("bloqueoHasta");
  if (!bloqueoHasta) return false;

  if (Date.now() > Number(bloqueoHasta)) {
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

  if (estaBloqueado()) {
    document.getElementById("mensaje").innerText =
      "Acceso bloqueado por 10 minutos.";
    return;
  }

  const nombre = nombreInput.value.trim();
  const correo = correoInput.value.trim();
  const p1 = p1Input.value.trim();
  const p2 = p2Input.value.trim();
  const p3 = p3Input.value.trim();

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

    localStorage.clear();

    formulario.classList.add("hidden");
    pdf.classList.remove("hidden");

    bienvenida.innerText = `Bienvenido/a ${nombre}`;
    bienvenida.classList.remove("hidden");

    cargarPDF();
  } else {
    registrarFallo();
    registrar(nombre, correo, "❌ Acceso denegado");
    mensaje.innerText = "Respuesta incorrecta.";
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

/* ===== CARGA PDF ===== */
function cargarPDF() {
  cargando.classList.remove("hidden");

  pdfjsLib.getDocument(urlPDF).promise.then(pdfLoaded => {
    pdfDoc = pdfLoaded;
    paginaActual = 1;
    renderPagina(false);

    /* Ocultar bienvenida cuando ya cargó */
    setTimeout(() => {
      bienvenida.classList.add("hidden");
      cargando.classList.add("hidden");
    }, 800);
  });
}

/* ===== RENDER CON ANIMACIÓN ===== */
function renderPagina(animar = true, direccion = "next") {
  if (animando) return;
  animando = true;

  pdfDoc.getPage(paginaActual).then(page => {
    const viewportBase = page.getViewport({ scale: 1 });
    const scale = Math.min(
      window.innerWidth / viewportBase.width,
      window.innerHeight / viewportBase.height
    );

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.classList.add("pagina");

    if (animar) {
      canvas.classList.add(
        direccion === "next" ? "flip-next" : "flip-prev"
      );
    }

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      /* Marca de agua */
      ctx.globalAlpha = 0.12;
      ctx.font = "40px Arial";
      ctx.rotate(-0.3);
      ctx.fillText("Documento confidencial", 50, canvas.height / 2);
      ctx.globalAlpha = 1;
    });

    pdfViewer.innerHTML = "";
    pdfViewer.appendChild(canvas);

    setTimeout(() => (animando = false), 600);
  });
}

/* ===== CLIC ===== */
pdfViewer.addEventListener("click", e => {
  const mitad = window.innerWidth / 2;

  if (e.clientX > mitad && paginaActual < pdfDoc.numPages) {
    paginaActual++;
    renderPagina(true, "next");
  } else if (e.clientX <= mitad && paginaActual > 1) {
    paginaActual--;
    renderPagina(true, "prev");
  }
});

/* ===== SWIPE ===== */
let inicioX = 0;

pdfViewer.addEventListener("touchstart", e => {
  inicioX = e.touches[0].clientX;
});

pdfViewer.addEventListener("touchend", e => {
  const diff = inicioX - e.changedTouches[0].clientX;

  if (Math.abs(diff) > 50) {
    if (diff > 0 && paginaActual < pdfDoc.numPages) {
      paginaActual++;
      renderPagina(true, "next");
    } else if (diff < 0 && paginaActual > 1) {
      paginaActual--;
      renderPagina(true, "prev");
    }
  }
});

/* ===== CERRAR ===== */
function cerrarPDF() {
  pdf.classList.add("hidden");
  formulario.classList.remove("hidden");
  pdfViewer.innerHTML = "";
  pdfDoc = null;
}
