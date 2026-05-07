// Variables Globales de Estado
let canchaActual = "";
let fechaActual = new Date(); // El Salvador Time (CST)
let mesVisualizado = fechaActual.getMonth();
let anioVisualizado = fechaActual.getFullYear();
let diaSeleccionado = null; // Formato YYYY-MM-DD
let horaSeleccionada = null;

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Horarios de operación del negocio (Ej: 4 PM a 10 PM)
const horasOperacion = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

// 1. Mostrar Panel Principal
function seleccionarCancha(nombre) {
    canchaActual = nombre;
    document.getElementById("nombre-cancha-seleccionada").innerText = nombre;
    document.getElementById("panel-reserva").classList.remove("hidden");
    
    // Resetear selecciones
    diaSeleccionado = null;
    document.getElementById("fecha-seleccionada").innerText = "...";
    document.getElementById("grid-horas").innerHTML = '<p class="instruccion">Selecciona un día en el calendario.</p>';
    document.getElementById("form-confirmacion").classList.add("hidden");
    document.getElementById("mensaje-feedback").innerText = "";

    // Generar el calendario
    generarCalendario(mesVisualizado, anioVisualizado);
    
    // Hacer scroll suave hacia el panel
    document.getElementById("panel-reserva").scrollIntoView({ behavior: 'smooth' });
}

// 2. Lógica del Calendario
function generarCalendario(mes, anio) {
    const contenedorDias = document.getElementById("dias-calendario");
    contenedorDias.innerHTML = "";
    document.getElementById("mes-anio").innerText = `${meses[mes]} ${anio}`;

    const primerDia = new Date(anio, mes, 1).getDay(); // Día de la semana que empieza el mes
    const diasEnMes = new Date(anio, mes + 1, 0).getDate(); // Total de días del mes

    // Espacios en blanco antes del primer día
    for (let i = 0; i < primerDia; i++) {
        const divVacio = document.createElement("div");
        divVacio.classList.add("dia", "vacio");
        contenedorDias.appendChild(divVacio);
    }

    // Días del mes
    const hoy = new Date();
    hoy.setHours(0,0,0,0); // Ignorar hora para comparar solo fechas

    for (let i = 1; i <= diasEnMes; i++) {
        const divDia = document.createElement("div");
        divDia.classList.add("dia");
        divDia.innerText = i;

        // Formatear la fecha como YYYY-MM-DD
        const fechaIterada = new Date(anio, mes, i);
        const mesStr = String(mes + 1).padStart(2, '0');
        const diaStr = String(i).padStart(2, '0');
        const fechaString = `${anio}-${mesStr}-${diaStr}`;

        // Deshabilitar días pasados
        if (fechaIterada < hoy) {
            divDia.classList.add("pasado");
        } else {
            // Evento click solo para días válidos
            divDia.onclick = () => seleccionarDia(fechaString, divDia);
        }

        // Mantener selección visual si cambia de mes y vuelve
        if (fechaString === diaSeleccionado) {
            divDia.classList.add("seleccionado");
        }

        contenedorDias.appendChild(divDia);
    }
}

function cambiarMes(direccion) {
    mesVisualizado += direccion;
    if (mesVisualizado < 0) {
        mesVisualizado = 11;
        anioVisualizado--;
    } else if (mesVisualizado > 11) {
        mesVisualizado = 0;
        anioVisualizado++;
    }
    generarCalendario(mesVisualizado, anioVisualizado);
}

// 3. Lógica de Selección de Día y Horas
function seleccionarDia(fechaString, elementoDia) {
    diaSeleccionado = fechaString;
    horaSeleccionada = null; // Resetear hora al cambiar de día

    // Actualizar UI del calendario
    const todosLosDias = document.querySelectorAll('.dia');
    todosLosDias.forEach(d => d.classList.remove('seleccionado'));
    elementoDia.classList.add('seleccionado');

    document.getElementById("fecha-seleccionada").innerText = fechaString;
    document.getElementById("form-confirmacion").classList.add("hidden");
    document.getElementById("mensaje-feedback").innerText = "";

    cargarHorariosDisponibles(fechaString);
}

function cargarHorariosDisponibles(fecha) {
    const gridHoras = document.getElementById("grid-horas");
    gridHoras.innerHTML = "";

    // Simular lectura de base de datos
    let reservasGlobales = JSON.parse(localStorage.getItem('reservasEurosoccer')) || [];

    horasOperacion.forEach(hora => {
        const btnHora = document.createElement("button");
        btnHora.innerText = `${hora} - ${parseInt(hora)+1}:00`;
        
        const idReserva = `${canchaActual}_${fecha}_${hora}`;

        // Verificar si existe en la "base de datos"
        if (reservasGlobales.includes(idReserva)) {
            btnHora.classList.add("hora-btn", "ocupada");
            btnHora.disabled = true;
            btnHora.innerText += " (Ocupado)";
        } else {
            btnHora.classList.add("hora-btn", "disponible");
            btnHora.onclick = () => elegirHora(hora, btnHora);
        }

        gridHoras.appendChild(btnHora);
    });
}

function elegirHora(hora, botonHtml) {
    horaSeleccionada = hora;

    // Actualizar UI de los botones de hora
    const todosBotones = document.querySelectorAll('.hora-btn.disponible');
    todosBotones.forEach(btn => btn.classList.remove('seleccionada'));
    botonHtml.classList.add('seleccionada');

    // Mostrar el formulario final
    document.getElementById("form-confirmacion").classList.remove("hidden");
}

// Función para generar ID único
function generarIdReserva() {
    return 'RES-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// 4. Procesar la Reserva Final
document.getElementById("form-confirmacion").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!diaSeleccionado || !horaSeleccionada) return;

    let nombre = document.getElementById("nombre-cliente").value;
    let idUnico = generarIdReserva();
    let idBloqueo = `${canchaActual}_${diaSeleccionado}_${horaSeleccionada}`;

    // Escribir en la Base de Datos (Local por ahora)
    let reservasGlobales = JSON.parse(localStorage.getItem('reservasEurosoccer')) || [];
    
    // Verificar si la hora ya fue tomada
    if (reservasGlobales.some(r => r.bloqueo === idBloqueo)) {
        alert("Lo sentimos, alguien acaba de reservar este turno.");
        cargarHorariosDisponibles(diaSeleccionado);
        return;
    }

    // Estructura del objeto para que el Admin lo pueda leer bien
    let nuevaReserva = {
        id: idUnico,
        bloqueo: idBloqueo,
        cancha: canchaActual,
        fecha: diaSeleccionado,
        hora: horaSeleccionada,
        cliente: nombre,
        estado: "Confirmada"
    };

    reservasGlobales.push(nuevaReserva);
    localStorage.setItem('reservasEurosoccer', JSON.stringify(reservasGlobales));

    const fb = document.getElementById("mensaje-feedback");
    fb.style.color = "var(--accent-green)";
    fb.innerHTML = `¡Reserva confirmada!<br>Tu código es: <strong>${idUnico}</strong><br>Guárdalo por si necesitas modificar tu turno.`;

    document.getElementById("form-confirmacion").classList.add("hidden");
    document.getElementById("nombre-cliente").value = "";
    cargarHorariosDisponibles(diaSeleccionado);
});

// IMPORTANTE: En tu función cargarHorariosDisponibles() en app.js, asegúrate de cambiar la verificación a:
// if (reservasGlobales.some(r => r.bloqueo === idReserva)) {