const PASSWORD_ADMIN = "euro2026"; // Tu contraseña provisional

document.getElementById("form-login").addEventListener("submit", function(e) {
    e.preventDefault();
    const pass = document.getElementById("admin-pass").value;

    if (pass === PASSWORD_ADMIN) {
        document.getElementById("login-section").classList.add("hidden");
        document.getElementById("dashboard-section").classList.remove("hidden");
        document.getElementById("btn-logout").classList.remove("hidden");
        cargarTablaReservas();
    } else {
        document.getElementById("login-error").classList.remove("hidden");
    }
});

function cerrarSesion() {
    document.getElementById("login-section").classList.remove("hidden");
    document.getElementById("dashboard-section").classList.add("hidden");
    document.getElementById("btn-logout").classList.add("hidden");
    document.getElementById("admin-pass").value = "";
}

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
            <td><button class="btn-eliminar" onclick="eliminarReserva('${reserva.id}')">Cancelar</button></td>
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