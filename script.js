function validar() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();

  const p1 = document.getElementById("p1").value.trim();
  const p2 = document.getElementById("p2").value.trim();
  const p3 = document.getElementById("p3").value.trim();

  const mensaje = document.getElementById("mensaje");

  // Respuestas correctas EXACTAS
  const r1 = "Damiano David";
  const r2 = "5/4/08";
  const r3 = "El Mentalista";

  // Validar campos vacíos
  if (!nombre || !correo || !p1 || !p2 || !p3) {
    mensaje.innerText = "Debes completar todos los campos.";
    return;
  }

  // Validar respuestas
  if (p1 === r1 && p2 === r2 && p3 === r3) {
    document.getElementById("formulario").classList.add("hidden");
    document.getElementById("pdf").classList.remove("hidden");
  } else {
    mensaje.innerText = "Alguna respuesta es incorrecta. Revisa mayúsculas y formato.";
  }
}
