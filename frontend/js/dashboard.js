document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión (Seguridad: Autenticación) [cite: 86]
    const token = localStorage.getItem('token');
    if (!token) window.location.href = 'login.html';

    const userName = localStorage.getItem('userName') || 'Usuario';
    const userRole = localStorage.getItem('userRole') || 'No definido';

    document.getElementById('userNameDisplay').textContent = localStorage.getItem('userName');
    document.getElementById('userRoleDisplay').textContent = localStorage.getItem('userRole');

    cargarControles();

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.clear(); // Limpia token, nombre y rol
        window.location.href = 'login.html';
    });
    document.getElementById('btnGuardar').addEventListener('click', guardarProgreso);
});

async function cargarControles() {
    try {
        const response = await fetch('http://localhost:3000/api/controles', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
        });
        if (!response.ok) throw new Error('Error al obtener controles');

        const controles = await response.json();
        
        const tbody = document.getElementById('controlesBody');
        tbody.innerHTML = '';

        controles.forEach(control => {
            const tr = document.createElement('tr');
            tr.dataset.id = control.id; 
            tr.innerHTML = `
                <td>${control.codigo}</td>
                <td>${control.nombre_control}</td>
                <td>${control.categoria}</td>
                <td>
                    <select class="status-select" data-id="${control.id}">
                        <option value="en proceso">En proceso</option>
                        <option value="cumple">Cumple</option>
                        <option value="no cumple">No cumple</option>
                    </select>
                </td>
                <td><input type="text" class="obs-input" placeholder="Observaciones"></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar controles:", error);
    }
}

// FUNCIÓN PARA ENVIAR LOS CAMBIOS AL BACKEND
async function guardarProgreso() {
    const filas = document.querySelectorAll('#tablaControles tr');
    
    // Mapeamos cada fila para obtener su ID, estado seleccionado y observación
    const avances = Array.from(filas).map(fila => ({
        control_id: fila.dataset.id,
        estado: fila.querySelector('.select-estado').value,
        observaciones: fila.querySelector('.input-obs').value
    }));

    try {
        const response = await fetch('http://localhost:3000/api/controles/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ avances })
        });

        if (response.ok) {
            alert("¡Progreso guardado con éxito!");
        } else {
            const error = await response.json();
            alert("Error al guardar: " + error.mensaje);
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        alert("Error de conexión al intentar guardar.");
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}