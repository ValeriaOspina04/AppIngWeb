// Variable global para almacenar los datos
window.datosControlesGlobal = [];

// 1. CARGA INICIAL
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Mostrar datos en el header
    const nameDisp = document.getElementById('userNameDisplay');
    const roleDisp = document.getElementById('userRoleDisplay');
    if (nameDisp) nameDisp.textContent = localStorage.getItem('userName') || 'Usuario';
    if (roleDisp) roleDisp.textContent = localStorage.getItem('userRole') || 'Rol';

    cargarControles();
    restringirAccesosPorRol();
});

// 2. CONTROL DE ACCESOS (Maneja la barra lateral)
function restringirAccesosPorRol() {
    const rol = (localStorage.getItem('userRole') || '').toLowerCase().trim();
    
    const btnAuditor = document.getElementById('tab-auditor');
    const btnCapacitador = document.getElementById('tab-capacitador');
    const btnImplementador = document.getElementById('tab-implementador');

    // Ocultar botones de navegación por defecto
    if (btnAuditor) btnAuditor.style.display = 'none';
    if (btnCapacitador) btnCapacitador.style.display = 'none';
    if (btnImplementador) btnImplementador.style.display = 'none';

    // Mostrar según rol
    if (rol === 'implementador') {
        if (btnImplementador) btnImplementador.style.display = 'block';
        showTab('implementador');
    } else if (rol === 'capacitador') {
        if (btnCapacitador) btnCapacitador.style.display = 'block';
        showTab('capacitador');
    } else if (rol === 'auditor') {
        if (btnAuditor) btnAuditor.style.display = 'block';
        showTab('auditor');
    } else if (rol === 'admin') {
        if (btnAuditor) btnAuditor.style.display = 'block';
        if (btnCapacitador) btnCapacitador.style.display = 'block';
        if (btnImplementador) btnImplementador.style.display = 'block';
        showTab('auditor');
    }
}

// 3. CAMBIO DE PESTAÑA
function showTab(roleId) {
    const rolUsuario = (localStorage.getItem('userRole') || '').toLowerCase();
    if (rolUsuario !== 'admin' && rolUsuario !== roleId) return;

    // Ocultar textos de bienvenida/instrucciones
    document.querySelectorAll('.role-section').forEach(s => s.style.display = 'none');
    const seccionActiva = document.getElementById(roleId);
    if (seccionActiva) seccionActiva.style.display = 'block';

    // Clase activa en botones sidebar
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${roleId}`)?.classList.add('active');

    // Actualizar encabezados de la tabla
    const thEstado = document.getElementById('th-estado');
    const thAccion = document.getElementById('th-accion');

    if (roleId === 'capacitador') {
        thEstado.textContent = 'Enfoque: Enseñar'; 
        thAccion.textContent = 'Evidencia / Material';
    } else if (roleId === 'implementador') {
        thEstado.textContent = 'Enfoque: Hacer'; 
        thAccion.textContent = 'Fecha Límite';
    } else {
        thEstado.textContent = 'Estado Auditoría'; 
        thAccion.textContent = 'Observaciones';
    }

    renderizarTabla(roleId);
}

// 4. DIBUJAR TABLA
function renderizarTabla(modo) {
    const tbody = document.getElementById('controlesBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    window.datosControlesGlobal.forEach(control => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', control.control_id || control.id);

        let celdasExtra = '';
        
        if (modo === 'implementador') {
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}> Por Implementar</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}> En Proceso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}> Cumplido</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="input-responsable" value="${control.responsable || ''}" placeholder="Responsable">
                    <input type="date" class="input-fecha" value="${control.fecha_limite || ''}" style="margin-top:5px">
                </td>`;
        } else if (modo === 'capacitador') {
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>Pendiente</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}> Capacitando</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>🎓 Finalizado</option>
                    </select>
                </td>
                <td><input type="url" class="input-evidencia" placeholder="Link evidencia" value="${control.link_evidencia || ''}"></td>`;
        } else {
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>No Iniciado</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Cumple</option>
                    </select>
                </td>
                <td><input type="text" class="input-observacion" value="${control.observaciones || ''}" placeholder="Observaciones"></td>`;
        }

        tr.innerHTML = `<td>${control.codigo}</td><td>${control.nombre_control}</td><td>${control.categoria || 'Gral'}</td>${celdasExtra}`;
        tbody.appendChild(tr);
    });
}
}

// 5. ACCIÓN: GUARDAR
async function guardarProgreso() {
    const btn = document.getElementById('btnGuardar');
    const filas = document.querySelectorAll('#controlesBody tr');
    
    // Mapeamos los datos con cuidado
    const avances = Array.from(filas).map(f => {
        // Capturamos los valores de los inputs
        const estadoSelect = f.querySelector('.status-select')?.value;
        const responsableInput = f.querySelector('.input-responsable')?.value;
        
        return {
            control_id: f.dataset.id,
            // Si hay un select (Auditor), usamos ese valor. 
            // Si no (Implementador), mandamos un estado por defecto para que la DB no de error.
            estado: estadoSelect || "En Proceso", 
            observaciones: f.querySelector('.input-observacion')?.value || null,
            responsable: responsableInput || null,
            fecha_limite: f.querySelector('.input-fecha')?.value || null,
            link_evidencia: f.querySelector('.input-evidencia')?.value || null
        };
    });

    try {
        btn.disabled = true;
        btn.textContent = "Guardando...";

        const res = await fetch('/api/controles/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ avances })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ ¡Progreso guardado con éxito!");
        } else {
            // Esto nos dirá exactamente qué campo está mal según el servidor
            console.error("Detalle del error:", data);
            alert("❌ Error al guardar: " + (data.mensaje || "Revisa los datos"));
        }
    } catch (e) {
        console.error("Error de red:", e);
        alert("🚫 Error de conexión con el servidor.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>💾</span> Guardar Progreso Actual';
    }
}

// 6. ACCIÓN: REPORTES
function generarReporte() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.text("Reporte de Cumplimiento ISO 27001", 14, 15);

    doc.autoTable({
        html: '#tablaIso',
        startY: 25,
        didParseCell: (data) => {
            const select = data.cell.raw.querySelector?.('select');
            const inputs = data.cell.raw.querySelectorAll?.('input');

            if (select) {
                // Solo extrae el texto, eliminando cualquier caracter especial o emoji
                let texto = select.options[select.selectedIndex].text;
                data.cell.text = [texto.replace(/[^\x20-\x7E]/g, '').trim()]; 
            } else if (inputs && inputs.length > 0) {
                const valores = Array.from(inputs).map(i => i.value).filter(v => v !== "");
                data.cell.text = [valores.join(" | ")];
            }
        }
    });
    doc.save("Reporte_Limpio.pdf");
}


// 7. FUNCIONES AUXILIARES
async function cargarControles() {
    try {
        const res = await fetch('/api/controles', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        window.datosControlesGlobal = await res.json();
        const rol = (localStorage.getItem('userRole') || 'auditor').toLowerCase();
        showTab(rol);
    } catch (e) { console.error("Error al cargar datos:", e); }
}

function toggleMenu() {
    const items = document.getElementById('dropdown-items');
    if (items) items.style.display = (items.style.display === 'flex') ? 'none' : 'flex';
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}
