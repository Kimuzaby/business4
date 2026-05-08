// ==========================================
// 0. CONFIGURACIÓN DE FIREBASE (PEGA LA MISMA DE APP.JS)
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const PASSWORD_ADMIN = "euro2026"; 
let reservasAdminGlobal = []; // Memoria temporal para buscar datos a editar

// ==========================================
// 1. GESTIÓN DE SESIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("euroAdminLogueado") === "true") {
        mostrarDashboard();
    }
});

document.getElementById("form-login").addEventListener("submit", function(e) {
    e.preventDefault();
    const pass = document.getElementById("admin-pass").value;
    if (pass === PASSWORD_ADMIN) {
        localStorage.setItem("euroAdminLogueado", "true"); 
        mostrarDashboard();
    } else {
        document.getElementById("login-error").classList.remove("hidden");
    }
});

function mostrarDashboard() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");
    document.getElementById("btn-logout").classList.remove("hidden");
    document.getElementById("admin-pass").value = "";
    document.getElementById("login-error").classList.add("hidden");
    
    // Iniciar escucha de la base de datos
    escucharReservas();
}

function cerrarSesion() {
    localStorage.removeItem("euroAdminLogueado"); 
    document.getElementById("login-section").classList.remove("hidden");
    document.getElementById("dashboard-section").classList.add("hidden");
    document.getElementById("btn-logout").classList.add("hidden");
}

// ==========================================
// 2. LECTURA EN TIEMPO REAL DESDE FIREBASE
// ==========================================
function escucharReservas() {
    db.collection("reservas").onSnapshot((querySnapshot) => {
        reservasAdminGlobal = [];
        const tbody = document.getElementById("lista-reservas");
        tbody.innerHTML = "";

        if (querySnapshot.empty) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No hay reservas registradas.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            reservasAdminGlobal.push(doc.data());
        });

        // Ordenar por fecha cronológica
        reservasAdminGlobal.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        reservasAdminGlobal.forEach(reserva => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td><strong>${reserva.id}</strong></td>
                <td>${reserva.cliente}</td>
                <td>${reserva.cancha}</td>
                <td>${reserva.fecha}</td>
                <td>${reserva.hora}</td>
                <td class="acciones-flex">
                    <button class="btn-editar" onclick="abrirModalEditar('${reserva.id}')">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarReserva('${reserva.id}')">Cancelar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    });
}

// ==========================================
// 3. ELIMINAR Y EDITAR EN FIREBASE
// ==========================================
async function eliminarReserva(idReserva) {
    if (confirm(`¿Confirmar cancelación de la reserva ${idReserva}?`)) {
        try {
            await db.collection("reservas").doc(idReserva).delete();
            // No necesitamos recargar la tabla manualmente porque el 'onSnapshot' lo hará instantáneamente.
        } catch (error) {
            alert("Error al intentar eliminar. Revisa tu conexión.");
        }
    }
}

function abrirModalEditar(idReserva) {
    let reservaActual = reservasAdminGlobal.find(r => r.id === idReserva);

    if (reservaActual) {
        document.getElementById("edit-id").value = reservaActual.id;
        document.getElementById("txt-edit-id").innerText = reservaActual.id;
        document.getElementById("edit-cliente").value = reservaActual.cliente;
        document.getElementById("edit-cancha").value = reservaActual.cancha;
        document.getElementById("edit-fecha").value = reservaActual.fecha;
        document.getElementById("edit-hora").value = reservaActual.hora;
        document.getElementById("modal-editar").classList.remove("hidden");
    }
}

function cerrarModal() {
    document.getElementById("modal-editar").classList.add("hidden");
}

document.getElementById("form-editar").addEventListener("submit", async function(e) {
    e.preventDefault();

    let idReserva = document.getElementById("edit-id").value;
    let nuevoCliente = document.getElementById("edit-cliente").value;
    let nuevaCancha = document.getElementById("edit-cancha").value;
    let nuevaFecha = document.getElementById("edit-fecha").value;
    let nuevaHora = document.getElementById("edit-hora").value;
    
    let nuevoBloqueo = `${nuevaCancha}_${nuevaFecha}_${nuevaHora}`;

    // Validar conflicto de horarios
    let conflicto = reservasAdminGlobal.some(r => r.bloqueo === nuevoBloqueo && r.id !== idReserva);
    if (conflicto) {
        alert("¡Error! La cancha seleccionada ya está reservada en esa fecha y hora.");
        return;
    }

    try {
        const btn = e.target.querySelector('.btn-guardar');
        btn.innerText = "Guardando...";
        
        await db.collection("reservas").doc(idReserva).update({
            cliente: nuevoCliente,
            cancha: nuevaCancha,
            fecha: nuevaFecha,
            hora: nuevaHora,
            bloqueo: nuevoBloqueo
        });

        cerrarModal();
        btn.innerText = "Guardar Cambios";
        alert("Reserva actualizada con éxito.");
    } catch (error) {
        alert("Error al actualizar la base de datos.");
    }
});