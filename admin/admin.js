const PASSWORD_ADMIN = "euro2026"; // Tu contraseña provisional

// 1. Verificar si la sesión ya está iniciada al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("euroAdminLogueado") === "true") {
        mostrarDashboard();
    }
});

// 2. Proceso de Login
document.getElementById("form-login").addEventListener("submit", function(e) {
    e.preventDefault();
    const pass = document.getElementById("admin-pass").value;

    if (pass === PASSWORD_ADMIN) {
        localStorage.setItem("euroAdminLogueado", "true"); // Guardamos la sesión
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
    cargarTablaReservas();
}

function cerrarSesion() {
    localStorage.removeItem("euroAdminLogueado"); // Borramos la sesión
    document.getElementById("login-section").classList.remove("hidden");
    document.getElementById("dashboard-section").classList.add("hidden");
    document.getElementById("btn-logout").classList.add("hidden");
}

// 3. Renderizar Tabla
function cargarTablaReservas() {
    const tbody = document.getElementById("lista-reservas");
    tbody.innerHTML = "";

    let reservas = JSON.parse(localStorage.getItem('reservasEurosoccer')) || [];

    if (reservas.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No hay reservas registradas.</td></tr>";
        return;
    }

    reservas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    reservas.forEach(reserva => {
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
}

function eliminarReserva(idReserva) {
    if (confirm(`¿Confirmar cancelación de la reserva ${idReserva}?`)) {
        let reservas = JSON.parse(localStorage.getItem('reservasEurosoccer')) || [];
        reservas = reservas.filter(r => r.id !== idReserva);
        localStorage.setItem('reservasEurosoccer', JSON.stringify(reservas));
        cargarTablaReservas();
    }
}

// 4. Lógica de Edición (Modal)
function abrirModalEditar(idReserva) {
    let reservas = JSON.parse(localStorage.getItem('reservasEurosoccer')) || [];
    let reservaActual = reservas.find(r => r.id === idReserva);

    if (reservaActual) {
        // Llenar el formulario con los datos actuales
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

document.getElementById("form-editar").addEventListener("submit", function(e) {
    e.preventDefault();

    let idReserva = document.getElementById("edit-id").value;
    let nuevoCliente = document.getElementById("edit-cliente").value;
    let nuevaCancha = document.getElementById("edit-cancha").value;
    let nuevaFecha = document.getElementById("edit-fecha").value;
    let nuevaHora = document.getElementById("edit-hora").value;
    
    let nuevoBloqueo = `${nuevaCancha}_${nuevaFecha}_${nuevaHora}`;

    let reservas = JSON.parse(localStorage.getItem('reservasEurosoccer')) || [];
    
    // Validar que el nuevo horario NO esté ocupado por OTRA reserva distinta
    let conflicto = reservas.some(r => r.bloqueo === nuevoBloqueo && r.id !== idReserva);
    
    if (conflicto) {
        alert("¡Error! La cancha seleccionada ya está reservada en esa fecha y hora. Elige otro horario.");
        return;
    }

    // Actualizar los datos de la reserva
    let index = reservas.findIndex(r => r.id === idReserva);
    if (index !== -1) {
        reservas[index].cliente = nuevoCliente;
        reservas[index].cancha = nuevaCancha;
        reservas[index].fecha = nuevaFecha;
        reservas[index].hora = nuevaHora;
        reservas[index].bloqueo = nuevoBloqueo;

        localStorage.setItem('reservasEurosoccer', JSON.stringify(reservas));
        
        cerrarModal();
        cargarTablaReservas(); // Recargar la tabla para ver los cambios
        alert("Reserva actualizada con éxito.");
    }
});