window.datosControlesGlobal = [];

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

        const response = await fetch('/api/usuarios', {
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

function showTab(roleId) {
    // 0. VALIDACIÓN DE SEGURIDAD
    // Obtenemos el rol real desde el localStorage
    const rolUsuario = (localStorage.getItem('userRole') || '').toLowerCase();
    
    // Si el usuario NO es admin y el roleId que quiere ver no coincide con su rol, bloqueamos.
    if (rolUsuario !== 'admin' && rolUsuario !== roleId) {
        console.warn(`Acceso denegado: El usuario con rol ${rolUsuario} intentó ver ${roleId}`);
        return; // Salimos de la función y no cambia nada
    }

    console.log("Cambiando a pestaña autorizada:", roleId);

    // 1. Ocultar todas las secciones
    const secciones = document.querySelectorAll('.role-section');
    secciones.forEach(sec => sec.style.display = 'none');

    // 2. Gestionar botones activos
    const botones = document.querySelectorAll('.tab-btn');
    botones.forEach(btn => btn.classList.remove('active'));

    // 3. Mostrar sección y activar botón
    const seccionObjetivo = document.getElementById(roleId);
    if (seccionObjetivo) seccionObjetivo.style.display = 'block';

    const botonActivo = document.getElementById(`tab-${roleId}`);
    if (botonActivo) botonActivo.classList.add('active');

    // 4. CAMBIAR ENCABEZADOS DE LA TABLA
    const thEstado = document.getElementById('th-estado');
    const thAccion = document.getElementById('th-accion');

    // Ajustamos los textos según el rol/sección
    if (roleId === 'capacitador') {
        if(thEstado) thEstado.textContent = 'Material de Apoyo';
        if(thAccion) thAccion.textContent = 'Subir Evidencia';
    } else if (roleId === 'implementador') {
        if(thEstado) thEstado.textContent = 'Responsable';
        if(thAccion) thAccion.textContent = 'Fecha Límite';
    } else {
        if(thEstado) thEstado.textContent = 'Estado';
        if(thAccion) thAccion.textContent = 'Observaciones';
    }

    // 5. REDIBUJAR LA TABLA CON EL NUEVO MODO
    if (window.datosControlesGlobal) {
        renderizarTabla(roleId);
    }
}

function renderizarTabla(modo) {
    const tbody = document.getElementById('controlesBody');
    const thEstado = document.getElementById('th-estado');
    const thAccion = document.getElementById('th-accion');

    if (!tbody) return;
    tbody.innerHTML = '';

    window.datosControlesGlobal.forEach(control => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', control.control_id || control.id);

        let celdasExtra = '';
        
        if (modo === 'implementador') {
            celdasExtra = `
                <td><input type="text" class="input-responsable" value="${control.responsable || ''}"></td>
                <td><input type="date" class="input-fecha" value="${control.fecha_limite || ''}"></td>`;
        } else if (modo === 'capacitador') {
            celdasExtra = `
                <td colspan="2"><input type="url" class="input-evidencia" placeholder="http://..." value="${control.link_evidencia || ''}"></td>`;
        } else { // Auditor
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>No Iniciado</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Cumple</option>
                    </select>
                </td>
                <td><input type="text" class="input-observacion" value="${control.observaciones || ''}"></td>`;
        }

        tr.innerHTML = `
            <td>${control.codigo}</td>
            <td>${control.nombre_control}</td>
            <td>${control.categoria || 'General'}</td>
            ${celda4}
            ${celda5}
        `;
        tbody.appendChild(tr);
    });
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}

// CARGA INICIAL (Cuando abre la página)
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    document.getElementById('userNameDisplay').textContent = localStorage.getItem('userName') || 'Usuario';
    document.getElementById('userRoleDisplay').textContent = localStorage.getItem('userRole') || 'Rol';

    cargarControles();
    
    
    
});    




async function cargarControles() {
    try {
        const response = await fetch('/api/controles', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const controles = await response.json();
        
        // 1. Guardamos los datos globalmente
        window.datosControlesGlobal = controles;
        
        // 2. Detectamos el rol actual para saber qué vista mostrar al inicio
        // Usamos minúsculas para evitar errores de coincidencia
        const rolActual = (localStorage.getItem('userRole') || 'auditor').toLowerCase();

        // 3. Llamamos a la función que pinta la tabla
        renderizarTabla(rolActual);

    } catch (error) {
        console.error("Error al cargar:", error);
    }
}

function restringirAccesosPorRol() {
    // 1. Obtener el rol y normalizarlo
    const rolRaw = localStorage.getItem('userRole') || '';
    const rol = rolRaw.toLowerCase().trim();
    
    console.log("Aplicando restricciones para el rol:", rol);

    // 2. Referencias a los botones de la barra lateral (Tabs)
    const btnAuditor = document.getElementById('tab-auditor');
    const btnCapacitador = document.getElementById('tab-capacitador');
    const btnImplementador = document.getElementById('tab-implementador');
    const dropdown = document.getElementById('dropdown-items');
    const arrow = document.getElementById('menu-arrow');

    // 3. OCULTAR TODO POR DEFECTO
    if (btnAuditor) btnAuditor.style.display = 'none';
    if (btnCapacitador) btnCapacitador.style.display = 'none';
    if (btnImplementador) btnImplementador.style.display = 'none';

    if (rol === 'implementador' || rol === 'auditor' || rol === 'capacitador') {
        if (dropdown) {
            dropdown.style.display = "flex"; // Lo abre automáticamente
            if (arrow) arrow.classList.add('rotate'); // Gira la flecha
        }
    }
    // 4. MOSTRAR SOLO LO PERMITIDO
    if (rol === 'implementador') {
        if (btnImplementador) btnImplementador.style.display = 'block';
        showTab('implementador'); // Forzamos a que abra su pestaña
    } 
    else if (rol === 'capacitador') {
        if (btnCapacitador) btnCapacitador.style.display = 'block';
        showTab('capacitador');
    } 
    else if (rol === 'auditor') {
        if (btnAuditor) btnAuditor.style.display = 'block';
        showTab('auditor');
    }
    else if (rol === 'admin') {
        // El admin si puede ver todo
        if (btnAuditor) btnAuditor.style.display = 'block';
        if (btnCapacitador) btnCapacitador.style.display = 'block';
        if (btnImplementador) btnImplementador.style.display = 'block';
        showTab('auditor');
    }
}
