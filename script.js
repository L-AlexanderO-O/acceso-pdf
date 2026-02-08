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

  if (!nombre || !correo || !p1 || !p2 || !p3) {
    mensaje.innerText = "Debes completar todos los campos.";
    return;
  }

  if (p1 === r1 && p2 === r2 && p3 === r3) {
    document.getElementById("formulario").classList.add("hidden");
    document.getElementById("pdf").classList.remove("hidden");
    cargarPDF();
  } else {
    mensaje.innerText = "Alguna respuesta es incorrecta. Revisa mayúsculas y formato.";
  }
}

/* ===== CONFIGURACIÓN PDF.js (OBLIGATORIA) ===== */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const urlPDF = "documento.pdf";

function cargarPDF() {
  const contenedor = document.getElementById("pdf-viewer");
  contenedor.innerHTML = "";

  pdfjsLib.getDocument(urlPDF).promise.then(pdf => {
    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
      pdf.getPage(pagina).then(page => {
        const escala = 1.5;
        const viewport = page.getViewport({ scale: escala });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        contenedor.appendChild(canvas);

        page.render({
          canvasContext: context,
          viewport: viewport
        });
      });
    }
  }).catch(err => {
    console.error("Error cargando PDF:", err);
  });
}
