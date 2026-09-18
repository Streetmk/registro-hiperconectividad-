/* ============================================================
   Registro Hiperconectividad
   Envía los datos del formulario a una hoja de Google Sheets
   mediante un Google Apps Script publicado como aplicación web.
   ============================================================ */

/* 1. Pega aquí la URL que te da Apps Script al implementar
      (termina en /exec). Ver INSTRUCCIONES.md */
const URL_HOJA = "https://script.google.com/macros/s/AKfycbzVNbBkmHC_FeOnUq8IjmFxqUl2FwuMCVpqLnkvvjsPAtGo9zlKh9_1DNS2ZvgCJfQiVg/exec";

const form    = document.getElementById("formRegistro");
const boton   = document.getElementById("botonEnviar");
const estado  = document.getElementById("estado");
const exito   = document.getElementById("exito");

const REQUERIDOS = {
  nombre:      "Escribe tu nombre completo.",
  correo:      "Escribe un correo válido.",
  institucion: "Dinos de qué institución o empresa vienes.",
  puesto:      "Escribe tu puesto o carrera.",
  aviso:       "Necesitamos tu autorización para registrarte."
};

function limpiarErrores() {
  document.querySelectorAll(".campo__error").forEach(p => (p.textContent = ""));
  document.querySelectorAll("[aria-invalid]").forEach(c => c.removeAttribute("aria-invalid"));
  estado.textContent = "";
}

function marcarError(campo, mensaje) {
  const p = document.querySelector(`[data-error="${campo}"]`);
  if (p) p.textContent = mensaje;
  const input = document.getElementById(campo);
  if (input) input.setAttribute("aria-invalid", "true");
}

function validar(datos) {
  let ok = true;
  let primero = null;

  for (const campo in REQUERIDOS) {
    const valor = campo === "aviso"
      ? document.getElementById("aviso").checked
      : (datos[campo] || "").trim();

    if (!valor) {
      marcarError(campo, REQUERIDOS[campo]);
      primero = primero || campo;
      ok = false;
    }
  }

  const correo = (datos.correo || "").trim();
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    marcarError("correo", "Revisa el formato del correo.");
    primero = primero || "correo";
    ok = false;
  }

  if (primero) document.getElementById(primero).focus();
  return ok;
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limpiarErrores();

  const datos = Object.fromEntries(new FormData(form).entries());
  datos.aviso = document.getElementById("aviso").checked ? "Sí" : "No";
  datos.fechaRegistro = new Date().toLocaleString("es-MX");

  if (!validar(datos)) return;

  boton.disabled = true;
  boton.textContent = "Enviando…";

  try {
    await fetch(URL_HOJA, {
      method: "POST",
      body: new URLSearchParams(datos) // sin encabezados extra: evita el preflight CORS
    });
    mostrarExito(datos.nombre);
  } catch (error) {
    // Reintento sin lectura de respuesta: el dato sí llega a la hoja
    try {
      await fetch(URL_HOJA, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(datos)
      });
      mostrarExito(datos.nombre);
    } catch (e) {
      estado.textContent = "No se pudo enviar el registro. Revisa tu conexión e inténtalo de nuevo.";
      boton.disabled = false;
      boton.textContent = "Registrarme";
    }
  }
});

function mostrarExito(nombre) {
  const soloNombre = nombre.trim().split(" ")[0];
  document.getElementById("exitoNombre").textContent = `Nos vemos ahí, ${soloNombre}`;
  form.hidden = true;
  document.querySelector(".registro__intro").hidden = true;
  exito.hidden = false;
  exito.scrollIntoView({ block: "center" });
}

document.getElementById("otroRegistro").addEventListener("click", () => {
  form.reset();
  limpiarErrores();
  form.hidden = false;
  document.querySelector(".registro__intro").hidden = false;
  exito.hidden = true;
  boton.disabled = false;
  boton.textContent = "Registrarme";
  document.getElementById("nombre").focus();
});
