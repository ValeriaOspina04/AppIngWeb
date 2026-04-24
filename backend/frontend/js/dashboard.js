window.datosControlesGlobal = [];

// 1. INICIO Y CARGA DE DATOS
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Mostrar datos del usuario en el header
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');

    if (document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').textContent = userName || 'Usuario';
    }
    if (document.getElementById('userRoleDisplay')) {
        document.getElementById('userRoleDisplay').textContent = userRole || 'Rol';
    }

    cargarControles();
    restringirAccesosPorRol();
});

// 2. OBTENER DATOS DEL SERVIDOR
async function cargarControles() {
    try {
        const res = await fetch('/api/controles', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        window.datosControlesGlobal = await res.json();
        
        const rol = (localStorage.getItem('userRole') || 'auditor').toLowerCase();
        showTab(rol);
    } catch (e) {
        console.error("Error al cargar controles:", e);
    }
}

function restringirAccesosPorRol() {
    // Normalizamos el rol para evitar errores de mayúsculas o espacios
    const rol = (localStorage.getItem('userRole') || '').toLowerCase().trim();
    
    const btnAuditor = document.getElementById('tab-auditor');
    const btnCapacitador = document.getElementById('tab-capacitador');
    const btnImplementador = document.getElementById('tab-implementador');
    const tituloDashboard = document.getElementById('titulo-dashboard');

    // Ocultar botones de navegación por defecto
    if (btnAuditor) btnAuditor.style.display = 'none';
    if (btnCapacitador) btnCapacitador.style.display = 'none';
    if (btnImplementador) btnImplementador.style.display = 'none';

    // Mostrar según rol
    if (rol === 'implementador') {
        if (btnImplementador) btnImplementador.style.display = 'block';
        if (tituloDashboard) tituloDashboard.textContent = "Panel de Implementación";
        showTab('implementador');
    } else if (rol === 'capacitador') {
        if (btnCapacitador) btnCapacitador.style.display = 'block';
        if (tituloDashboard) tituloDashboard.textContent = "Panel de Capacitación";
        showTab('capacitador');
    } else if (rol === 'auditor') {
        if (btnAuditor) btnAuditor.style.display = 'block';
        if (tituloDashboard) tituloDashboard.textContent = "Panel de Auditoría";
        showTab('auditor');
    } else if (rol === 'admin' || rol === 'todos') {
        // EL CAMBIO ESTÁ AQUÍ: Activamos todo para el rol "todos"
        if (btnAuditor) btnAuditor.style.display = 'block';
        if (btnCapacitador) btnCapacitador.style.display = 'block';
        if (btnImplementador) btnImplementador.style.display = 'block';
        if (tituloDashboard) tituloDashboard.textContent = "Control Integral ISO 27001";
        
        // Por defecto mostramos la pestaña de auditoría al entrar
        showTab('auditor'); 
    }
}

// 3. CAMBIO DE VISTA POR ROL
function showTab(roleId) {
    // Ocultar todas las secciones de mensaje
    document.querySelectorAll('.role-section').forEach(s => s.style.display = 'none');
    
    // Mostrar la sección correspondiente
    const seccionActiva = document.getElementById(roleId);
    if (seccionActiva) seccionActiva.style.display = 'block';

    // Actualizar encabezados de la tabla
    const thEstado = document.getElementById('th-estado');
    const thAccion = document.getElementById('th-accion');

    // Evitar errores si los elementos no existen en el HTML
    if (thEstado && thAccion) {
        if (roleId === 'capacitador') {
            thEstado.textContent = 'Enfoque: Enseñar';
            thAccion.textContent = 'Evidencia / Material';
        } else if (roleId === 'implementador') {
            thEstado.textContent = 'Enfoque: Hacer';
            thAccion.textContent = 'Fecha Límite';
        } else {
            thEstado.textContent = 'Estado de Auditoría';
            thAccion.textContent = 'Observaciones del Auditor';
        }
    }

    renderizarTabla(roleId);
}

// 4. DIBUJAR LA TABLA
function renderizarTabla(modo) {
    const tbody = document.getElementById('controlesBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!window.datosControlesGlobal || window.datosControlesGlobal.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay datos disponibles</td></tr>';
        return;
    }

    window.datosControlesGlobal.forEach(control => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', control.control_id || control.id);

        let celdasExtra = '';
        
        if (modo === 'implementador') {
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>No Iniciado</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Cumplido</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="input-responsable" value="${control.responsable || ''}" placeholder="Responsable">
                    <input type="date" class="input-fecha" value="${control.fecha_limite || ''}" style="display:block; margin-top:5px; width: 100%;">
                </td>`;
        } else if (modo === 'capacitador') {
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>Pendiente</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Curso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Finalizado</option>
                    </select>
                </td>
                <td><input type="url" class="input-evidencia" value="${control.link_evidencia || ''}" placeholder="Link material" style="width: 100%;"></td>`;
        } else {
            // Modo Auditor (default para admin/todos)
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>No Iniciado</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Cumple</option>
                    </select>
                </td>
                <td><input type="text" class="input-observacion" value="${control.observaciones || ''}" placeholder="Observaciones de auditoría" style="width: 100%;"></td>`;
        }

        tr.innerHTML = `
            <td><strong>${control.codigo}</strong></td>
            <td>${control.nombre_control}</td>
            <td><small>${control.categoria || 'Gral'}</small></td>
            ${celdasExtra}
        `;
        tbody.appendChild(tr);
    });
}
// 5. GUARDAR DATOS (Corregido para evitar "Datos Inválidos")
async function guardarProgreso() {
    const btn = document.getElementById('btnGuardar');
    const filas = document.querySelectorAll('#controlesBody tr');
    const nombreEmpresa = localStorage.getItem('nombre_empresa');
    // Mostramos en consola para saber que el botón SÍ funciona
    console.log("Intentando guardar...");

    const controles = Array.from(filas).map(f => {
        const fechaInput = f.querySelector('.input-fecha');
        return {
            control_id: parseInt(f.dataset.id),
            estado: f.querySelector('.status-select')?.value || 'No Iniciado',
            observaciones: f.querySelector('.input-observacion')?.value || null,
            responsable: f.querySelector('.input-responsable')?.value || null,
            fecha_limite: (fechaInput && fechaInput.value !== "") ? fechaInput.value : null,
            link_evidencia: f.querySelector('.input-evidencia')?.value || null
        };
    });

    try {
        btn.disabled = true;
        btn.textContent = "⏳ Guardando...";

        const res = await fetch('/api/controles/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                controles: controles, 
                nombre_empresa: nombreEmpresa 
            })
            
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ " + data.mensaje);
        } else {
            alert("⚠️ Error: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("🚫 No se pudo conectar con el servidor");
    } finally {
        btn.disabled = false;
        btn.textContent = "💾 Guardar Progreso Actual";
    }
}
// 6. GENERAR REPORTE (Limpio, sin símbolos raros)
function generarReporte() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.text("Reporte ISO 27001", 14, 15);

    doc.autoTable({
        html: '#tablaIso',
        startY: 25,
        didParseCell: (data) => {
            const select = data.cell.raw.querySelector?.('select');
            const inputs = data.cell.raw.querySelectorAll?.('input');

            if (select) {
                data.cell.text = [select.options[select.selectedIndex].text];
            } else if (inputs && inputs.length > 0) {
                const vals = Array.from(inputs).map(i => i.value).filter(v => v !== "");
                data.cell.text = [vals.join(" | ")];
            }
        }
    });
    doc.save("Reporte_ISO27001.pdf");
}

// Función para abrir/cerrar el menú desplegable de la sidebar
function toggleMenu() {
    const items = document.getElementById('dropdown-items');
    const arrow = document.getElementById('menu-arrow');
    
    if (items) {
        if (items.style.display === 'flex') {
            items.style.display = 'none';
            if (arrow) arrow.innerText = '▼';
        } else {
            items.style.display = 'flex';
            if (arrow) arrow.innerText = '▲';
        }
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}
