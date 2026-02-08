let respuestaCorrecta = "";

function generarPregunta(nombre) {
  const opciones = [
    {
      pregunta: "Escribe la PRIMERA letra de tu nombre en mayúscula",
      respuesta: nombre.charAt(0).toUpperCase()
    },
    {
      pregunta: "Escribe la ÚLTIMA letra de tu nombre en minúscula",
      respuesta: nombre.charAt(nombre.length - 1).toLowerCase()
    }
  ];

  const seleccion = opciones[Math.floor(Math.random() * opciones.length)];
  respuestaCorrecta = seleccion.respuesta;
  document.getElementById("pregunta").innerText = seleccion.pregunta;
}

document.getElementById("nombre").addEventListener("blur", function () {
  if (this.value.trim() !== "") {
    generarPregunta(this.value.trim());
  }
});

function validar() {
  const respuestaUsuario = document.getElementById("respuesta").value.trim();
  const mensaje = document.getElementById("mensaje");

  if (respuestaUsuario === respuestaCorrecta) {
    document.getElementById("formulario").classList.add("hidden");
    document.getElementById("pdf").classList.remove("hidden");
  } else {
    mensaje.innerText = "Respuesta incorrecta. Intenta de nuevo.";
  }
}
