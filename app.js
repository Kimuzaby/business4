// ==========================================
// 0. CONFIGURACIÓN DE FIREBASE
// ==========================================

// Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyB0aE3W6C7I56hyQ6_m0fTgWhOnU6sE_Kk",
    authDomain: "eurosoccer-95b4f.firebaseapp.com",
    projectId: "eurosoccer-95b4f",
    storageBucket: "eurosoccer-95b4f.firebasestorage.app",
    messagingSenderId: "254069018108",
    appId: "1:254069018108:web:50e888990856f19a0cb679"
  };

// Inicializar la aplicación y la base de datos
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 1. VARIABLES Y LECTURA EN TIEMPO REAL
// ==========================================
let canchaActual = "";
let fechaActual = new Date(); 
let mesVisualizado = fechaActual.getMonth();
let anioVisualizado = fechaActual.getFullYear();
let diaSeleccionado = null; 
let horaSeleccionada = null;
let reservasGlobales = []; // Ahora la llenará Firebase

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const horasOperacion = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

// LECTOR EN TIEMPO REAL: Se activa cada vez que alguien hace o borra una reserva en cualquier parte del mundo
db.collection("reservas").onSnapshot((querySnapshot) => {
    reservasGlobales = [];
    querySnapshot.forEach((doc) => {
        reservasGlobales.push(doc.data());
    });
    
    // Si un usuario está viendo un día específico, actualizamos los botones al instante
    if (diaSeleccionado) {
        cargarHorariosDisponibles(diaSeleccionado);
    }
});

// ==========================================
// 2. FUNCIONES DE INTERFAZ Y CALENDARIO
// ==========================================
function seleccionarCancha(nombre) {
    canchaActual = nombre;
    document.getElementById("nombre-cancha-seleccionada").innerText = nombre;
    document.getElementById("panel-reserva").classList.remove("hidden");
    
    diaSeleccionado = null;
    document.getElementById("fecha-seleccionada").innerText = "...";
    document.getElementById("grid-horas").innerHTML = '<p class="instruccion">Selecciona un día en el calendario.</p>';
    document.getElementById("form-confirmacion").classList.add("hidden");
    document.getElementById("mensaje-feedback").innerText = "";

    generarCalendario(mesVisualizado, anioVisualizado);
    document.getElementById("panel-reserva").scrollIntoView({ behavior: 'smooth' });
}

function generarCalendario(mes, anio) {
    const contenedorDias = document.getElementById("dias-calendario");
    contenedorDias.innerHTML = "";
    document.getElementById("mes-anio").innerText = `${meses[mes]} ${anio}`;

    const primerDia = new Date(anio, mes, 1).getDay(); 
    const diasEnMes = new Date(anio, mes + 1, 0).getDate(); 
    
    for (let i = 0; i < primerDia; i++) {
        const divVacio = document.createElement("div");
        divVacio.classList.add("dia", "vacio");
        contenedorDias.appendChild(divVacio);
    }

    const hoy = new Date();
    hoy.setHours(0,0,0,0); 

    for (let i = 1; i <= diasEnMes; i++) {
        const divDia = document.createElement("div");
        divDia.classList.add("dia");
        divDia.innerText = i;

        const fechaIterada = new Date(anio, mes, i);
        const mesStr = String(mes + 1).padStart(2, '0');
        const diaStr = String(i).padStart(2, '0');
        const fechaString = `${anio}-${mesStr}-${diaStr}`;

        if (fechaIterada < hoy) {
            divDia.classList.add("pasado");
        } else {
            divDia.onclick = () => seleccionarDia(fechaString, divDia);
        }

        if (fechaString === diaSeleccionado) {
            divDia.classList.add("seleccionado");
        }
        contenedorDias.appendChild(divDia);
    }
}

function cambiarMes(direccion) {
    mesVisualizado += direccion;
    if (mesVisualizado < 0) { mesVisualizado = 11; anioVisualizado--; } 
    else if (mesVisualizado > 11) { mesVisualizado = 0; anioVisualizado++; }
    generarCalendario(mesVisualizado, anioVisualizado);
}

function seleccionarDia(fechaString, elementoDia) {
    diaSeleccionado = fechaString;
    horaSeleccionada = null; 

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

    horasOperacion.forEach(hora => {
        const btnHora = document.createElement("button");
        btnHora.innerText = `${hora} - ${parseInt(hora)+1}:00`;
        
        const idReserva = `${canchaActual}_${fecha}_${hora}`;

        // Verificamos contra la memoria global que mantiene Firebase
        if (reservasGlobales.some(r => r.bloqueo === idReserva)) {
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
    const todosBotones = document.querySelectorAll('.hora-btn.disponible');
    todosBotones.forEach(btn => btn.classList.remove('seleccionada'));
    botonHtml.classList.add('seleccionada');
    document.getElementById("form-confirmacion").classList.remove("hidden");
}

function generarIdReserva() {
    return 'RES-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// ==========================================
// 3. ENVIAR DATOS A FIREBASE
// ==========================================
document.getElementById("form-confirmacion").addEventListener("submit", async function(e) {
    e.preventDefault();
    if (!diaSeleccionado || !horaSeleccionada) return;

    let nombre = document.getElementById("nombre-cliente").value;
    let idUnico = generarIdReserva();
    let idBloqueo = `${canchaActual}_${diaSeleccionado}_${horaSeleccionada}`;

    // Doble verificación: comprobar que no se reservó en los últimos milisegundos
    if (reservasGlobales.some(r => r.bloqueo === idBloqueo)) {
        alert("Lo sentimos, alguien acaba de reservar este turno.");
        cargarHorariosDisponibles(diaSeleccionado);
        return;
    }

    let nuevaReserva = {
        id: idUnico,
        bloqueo: idBloqueo,
        cancha: canchaActual,
        fecha: diaSeleccionado,
        hora: horaSeleccionada,
        cliente: nombre,
        estado: "Confirmada",
        creadoEn: firebase.firestore.FieldValue.serverTimestamp() // Sello de tiempo de Google
    };

    try {
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.innerText = "Procesando...";

        // Insertar documento en la colección 'reservas' usando el idUnico como nombre de archivo
        await db.collection("reservas").doc(idUnico).set(nuevaReserva);

        const fb = document.getElementById("mensaje-feedback");
        fb.style.color = "var(--accent-green)";
        fb.innerHTML = `¡Reserva confirmada!<br>Tu código es: <strong>${idUnico}</strong><br>Guárdalo por si necesitas modificar tu turno.`;

        document.getElementById("form-confirmacion").classList.add("hidden");
        document.getElementById("nombre-cliente").value = "";
        btn.disabled = false;
        btn.innerText = "Reservar Turno";

    } catch (error) {
        console.error("Error al guardar: ", error);
        alert("Hubo un problema de conexión. Intenta de nuevo.");
    }
});