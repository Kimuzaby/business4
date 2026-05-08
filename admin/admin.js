// ==========================================
// 0. CONFIGURACIÓN DE FIREBASE
// ==========================================
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

let reservasAdminGlobal = [];

// ==========================================
// 1. GESTIÓN DE SESIÓN
// ==========================================
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        mostrarDashboard();
    } else {
        cerrarSesionUI();
    }
});

document.getElementById("form-login").addEventListener("submit", function(e) {
    e.preventDefault();
    const email = "erickxavier.caballero@gmail.com";
    const pass = document.getElementById("admin-pass").value;
    const btn = e.target.querySelector('button');
    const errorEl = document.getElementById("login-error");

    btn.innerText = "Verificando...";
    btn.disabled = true;
    errorEl.classList.add("hidden");

    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(() => {
            btn.innerText = "Ingresar";
            btn.disabled = false;
        })
        .catch(() => {
            errorEl.classList.remove("hidden");
            btn.innerText = "Ingresar";
            btn.disabled = false;
        });
});

function mostrarDashboard() {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");
    document.getElementById("btn-logout").classList.remove("hidden");
    document.getElementById("admin-pass").value = "";
    document.getElementById("login-error").classList.add("hidden");
    escucharReservas();
}

function cerrarSesion() {
    firebase.auth().signOut();
}

function cerrarSesionUI() {
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

        // Update badge
        const badge = document.getElementById("conteo-reservas");
        if (badge) badge.innerText = `${querySnapshot.size} reserva${querySnapshot.size !== 1 ? 's' : ''}`;

        if (querySnapshot.empty) {
            tbody.innerHTML = "<tr><td colspan='6' style='text-align:center; padding:30px; color:var(--muted);'>No hay reservas registradas.</td></tr>";
            return;
        }

        querySnapshot.forEach((doc) => {
            reservasAdminGlobal.push(doc.data());
        });

        // Ordenar por fecha cronológica
        reservasAdminGlobal.sort((a, b) => {
            if (a.fecha !== b.fecha) return new Date(a.fecha) - new Date(b.fecha);
            return a.hora.localeCompare(b.hora);
        });

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
        } catch (error) {
            alert("Error al intentar eliminar. Revisa tu conexión.");
        }
    }
}

function abrirModalEditar(idReserva) {
    const reservaActual = reservasAdminGlobal.find(r => r.id === idReserva);
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

// Close modal clicking backdrop
document.getElementById("modal-editar").addEventListener("click", function(e) {
    if (e.target === this) cerrarModal();
});

document.getElementById("form-editar").addEventListener("submit", async function(e) {
    e.preventDefault();

    const idReserva = document.getElementById("edit-id").value;
    const nuevoCliente = document.getElementById("edit-cliente").value;
    const nuevaCancha = document.getElementById("edit-cancha").value;
    const nuevaFecha = document.getElementById("edit-fecha").value;
    const nuevaHora = document.getElementById("edit-hora").value;
    const nuevoBloqueo = `${nuevaCancha}_${nuevaFecha}_${nuevaHora}`;

    const conflicto = reservasAdminGlobal.some(r => r.bloqueo === nuevoBloqueo && r.id !== idReserva);
    if (conflicto) {
        alert("¡Error! La cancha seleccionada ya está reservada en esa fecha y hora.");
        return;
    }

    try {
        const btn = e.target.querySelector('.btn-guardar');
        btn.innerText = "Guardando...";
        btn.disabled = true;

        await db.collection("reservas").doc(idReserva).update({
            cliente: nuevoCliente,
            cancha: nuevaCancha,
            fecha: nuevaFecha,
            hora: nuevaHora,
            bloqueo: nuevoBloqueo
        });

        cerrarModal();
        btn.innerText = "Guardar Cambios";
        btn.disabled = false;
    } catch (error) {
        alert("Error al actualizar la base de datos.");
        const btn = e.target.querySelector('.btn-guardar');
        btn.innerText = "Guardar Cambios";
        btn.disabled = false;
    }
});