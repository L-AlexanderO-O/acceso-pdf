/* ===== URL DE GOOGLE APPS SCRIPT ===== */
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwihXjpvnumyOohddh3pQMEri_83Y3mmknWsXSz929Ru4oJ3vyr6lX8RWw2KpPBEEDksw/exec";

/* ===== CONFIGURACIÓN PDF.js (OBLIGATORIA) ===== */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const urlPDF = "documento.pdf";

/* ===== VALIDACIÓN + REGISTRO ===== */
function validar() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();

  const p1 = document.getElementById("p1").value.trim();
  const p2 = document.getElementById("p2").value.trim();
  const p3 = document.getElementById("p3").value.trim();

  const mensaje = document.getElementById("mensaje");

  const r1 = "Damiano David";
  const r2 = "5/4/08";
  const r3 = "El Mentalista";

  /* ❌ CAMPOS INCOMPLETOS */
  if (!nombre || !correo || !p1 || !p2 || !p3) {
    registrar(nombre, correo, "❌ Campos incompletos");
    mensaje.innerText = "Debes completar todos los campos.";
    return;
  }

  /* ✅ ACCESO PERMITIDO */
  if (p1 === r1 && p2 === r2 && p3 === r3) {
    registrar(nombre, correo, "✅ Acceso permitido");

    document.getElementById("formulario").classList.add("hidden");
    document.getElementById("pdf").classList.remove("hidden");

    document.getElementById("bienvenida").innerText =
      `Bienvenido/a ${nombre}`;

    cargarPDF();
  }
  /* ❌ ACCESO DENEGADO */
  else {
    registrar(nombre, correo, "❌ Acceso denegado");
    mensaje.innerText =
      "Alguna respuesta es incorrecta. Revisa mayúsculas y formato.";
  }
}

/* ===== REGISTRO EN GOOGLE SHEETS ===== */
function registrar(nombre, correo, resultado) {
  fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      nombre,
      correo,
      resultado
    })
  });
}

/* ===== VISOR PDF TIPO LIBRO ===== */
function cargarPDF() {
  const contenedor = document.getElementById("pdf-viewer");
  const cargando = document.getElementById("cargando");

  contenedor.innerHTML = "";
  cargando.classList.remove("hidden");

  pdfjsLib.getDocument(urlPDF).promise.then(pdf => {
    let paginaActual = 1;

    function renderPaginas() {
      if (paginaActual > pdf.numPages) {
        cargando.classList.add("hidden");
        return;
      }

      const paginasPorFila = window.innerWidth > 900 ? 2 : 1;

      for (let i = 0; i < paginasPorFila; i++) {
        if (paginaActual <= pdf.numPages) {
          pdf.getPage(paginaActual).then(page => {
            const escala = window.innerWidth > 900 ? 1.2 : 1.5;
            const viewport = page.getViewport({ scale: escala });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            /* Marca de agua */
            page.render({
              canvasContext: context,
              viewport: viewport
            }).promise.then(() => {
              context.globalAlpha = 0.12;
              context.font = "40px Arial";
              context.fillStyle = "black";
              context.rotate(-0.3);
              context.fillText("Documento confidencial", 50, canvas.height / 2);
              context.rotate(0.3);
              context.globalAlpha = 1;
            });

            contenedor.appendChild(canvas);
          });

          paginaActual++;
        }
      }

      setTimeout(renderPaginas, 100);
    }

    renderPaginas();
  }).catch(err => {
    cargando.classList.add("hidden");
    contenedor.innerHTML =
      "<p style='color:white;text-align:center'>Error cargando el documento</p>";
    console.error("Error cargando PDF:", err);
  });
}

/* ===== CERRAR DOCUMENTO ===== */
function cerrarPDF() {
  document.getElementById("pdf").classList.add("hidden");
  document.getElementById("formulario").classList.remove("hidden");
  document.getElementById("pdf-viewer").innerHTML = "";
}
