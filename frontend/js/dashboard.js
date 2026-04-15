async function guardarProgreso() {
    console.log("¡Click detectado desde el HTML!");
    
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerHTML;

    const tbody = document.getElementById('controlesBody');
    const filas = tbody.querySelectorAll('tr');
    
    if (filas.length === 0) {
        alert("No hay controles cargados para guardar.");
        return;
    }

    const avances = Array.from(filas).map(fila => {
    // Asegúrate de que 'id' sea el nombre exacto que usaste al crear el tr
    const idControl = fila.dataset.id; 
    
    console.log("ID capturado:", idControl); // Esto te servirá para depurar

    return {
        control_id: idControl, 
        estado: fila.querySelector('.status-select').value,
        observaciones: fila.querySelector('.obs-input').value
    };
});

    try {
        btn.innerHTML = '<span>⏳</span> Guardando...';
        btn.disabled = true;

        const response = await fetch('http://localhost:3000/api/controles/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ avances })
        });

        const data = await response.json();
        if (response.ok) {
            btn.innerHTML = '<span>✅</span> ¡Éxito!';
            btn.classList.add('btn-success-anim');
            setTimeout(() => {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }, 2000);

            alert("✅ " + data.mensaje);
        } else {
            alert("❌ Error: " + data.mensaje);
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        alert("🚫 Error de conexión con el servidor");
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// CARGA INICIAL (Cuando abre la página)
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userNameDisplay').textContent = localStorage.getItem('userName') || 'Usuario';
    document.getElementById('userRoleDisplay').textContent = localStorage.getItem('userRole') || 'Rol';

    cargarControles();
});

async function cargarControles() {
    try {
        const response = await fetch('http://localhost:3000/api/controles', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const controles = await response.json();
        const tbody = document.getElementById('controlesBody');
        tbody.innerHTML = '';

        controles.forEach(control => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', control.control_id || control.id); 
            tr.innerHTML = `
                <td>${control.codigo}</td>
                <td>${control.nombre_control}</td>
                <td>${control.categoria || 'General'}</td>
                <td>
                    <select class="status-select">
                        <option value="en proceso" ${control.estado === 'en proceso' ? 'selected' : ''}>En proceso</option>
                        <option value="cumple" ${control.estado === 'cumple' ? 'selected' : ''}>Cumple</option>
                        <option value="no cumple" ${control.estado === 'no cumple' ? 'selected' : ''}>No cumple</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="obs-input" value="${control.observaciones || ''}">
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar:", error);
    }
}