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

        let celda4 = ''; // Esta será la columna de "Estado / Material / Responsable"
        let celda5 = ''; // Esta será la columna de "Observaciones / Acción / Fecha"

        if (modo === 'capacitador') {
            // --- VISTA CAPACITADOR: Recuperamos los archivos ---
            if(thEstado) thEstado.textContent = 'Material';
            if(thAccion) thAccion.textContent = 'Acción';

            celda4 = `<td>${control.archivo_url ? '✅ Cargado' : '❌ Pendiente'}</td>`;
            celda5 = `
                <td>
                    <div style="display: flex; gap: 5px;">
                        <input type="file" id="file-${control.control_id}" style="width: 120px; font-size: 10px;">
                        <button onclick="subirEvidencia(${control.control_id})" style="cursor:pointer">📤</button>
                    </div>
                </td>`;
        } 
        else if (modo === 'implementador') {
            // --- VISTA IMPLEMENTADOR: Responsables ---
            if(thEstado) thEstado.textContent = 'Responsable';
            if(thAccion) thAccion.textContent = 'Fecha Límite';

            celda4 = `<td><input type="text" class="resp-input" placeholder="Nombre..." value="${control.responsable || ''}" style="width: 100%;"></td>`;
            celda5 = `<td><input type="date" class="date-input" value="${control.fecha_limite || ''}"></td>`;
        } 
        else {
            // --- VISTA AUDITOR: Cumplimiento (Por defecto) ---
            if(thEstado) thEstado.textContent = 'Estado';
            if(thAccion) thAccion.textContent = 'Observaciones';

            celda4 = `<td>
                <select class="status-select">
                    <option value="en proceso" ${control.estado === 'en proceso' ? 'selected' : ''}>En proceso</option>
                    <option value="cumple" ${control.estado === 'cumple' ? 'selected' : ''}>Cumple</option>
                    <option value="no cumple" ${control.estado === 'no cumple' ? 'selected' : ''}>No cumple</option>
                </select>
            </td>`;
            celda5 = `<td><input type="text" class="obs-input" value="${control.observaciones || ''}" style="width: 100%;"></td>`;
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
