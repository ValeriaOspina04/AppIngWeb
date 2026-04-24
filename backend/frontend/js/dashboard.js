window.datosControlesGlobal = [];

// 1. CARGA INICIAL
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Restaurar textos del header
    const nameDisp = document.getElementById('userNameDisplay');
    const roleDisp = document.getElementById('userRoleDisplay');
    if (nameDisp) nameDisp.textContent = localStorage.getItem('userName') || 'Usuario';
    if (roleDisp) roleDisp.textContent = localStorage.getItem('userRole') || 'Rol';

    cargarControles();
    restringirAccesosPorRol(); // <-- AQUÍ ESTÁ LO QUE HACÍA QUE NO SE VIERAN LOS BOTONES
});

// 2. LÓGICA DE BOTONES Y SEGURIDAD (RESTAURADA)
function restringirAccesosPorRol() {
    const rol = (localStorage.getItem('userRole') || '').toLowerCase().trim();
    
    const btnAuditor = document.getElementById('tab-auditor');
    const btnCapacitador = document.getElementById('tab-capacitador');
    const btnImplementador = document.getElementById('tab-implementador');
    const dropdown = document.getElementById('dropdown-items');
    const arrow = document.getElementById('menu-arrow');

    // Ocultar botones por defecto
    if (btnAuditor) btnAuditor.style.display = 'none';
    if (btnCapacitador) btnCapacitador.style.display = 'none';
    if (btnImplementador) btnImplementador.style.display = 'none';

    // Abrir menú lateral si tiene rol permitido
    if (['implementador', 'auditor', 'capacitador', 'admin'].includes(rol)) {
        if (dropdown) dropdown.style.display = "flex";
        if (arrow) arrow.classList.add('rotate');
    }

    // Mostrar solo su botón correspondiente
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

// 3. CAMBIAR DE PESTAÑA
function showTab(roleId) {
    const rolUsuario = (localStorage.getItem('userRole') || '').toLowerCase();
    if (rolUsuario !== 'admin' && rolUsuario !== roleId) return;

    document.querySelectorAll('.role-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const seccion = document.getElementById(roleId);
    if (seccion) seccion.style.display = 'block';
    
    const btnTab = document.getElementById(`tab-${roleId}`);
    if (btnTab) btnTab.classList.add('active');

    // Actualizar encabezados de la tabla
    const thEstado = document.getElementById('th-estado');
    const thAccion = document.getElementById('th-accion');

    if (roleId === 'capacitador') {
        if(thEstado) thEstado.textContent = 'Enfoque: Enseñar'; 
        if(thAccion) thAccion.textContent = 'Evidencia de Capacitación';
    } else if (roleId === 'implementador') {
        if(thEstado) thEstado.textContent = 'Enfoque: Hacer'; 
        if(thAccion) thAccion.textContent = 'Fecha Límite';
    } else {
        if(thEstado) thEstado.textContent = 'Estado Auditoría'; 
        if(thAccion) thAccion.textContent = 'Observaciones';
    }

    renderizarTabla(roleId);
}

// 4. RENDERIZAR TABLA
function renderizarTabla(modo) {
    const tbody = document.getElementById('controlesBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    window.datosControlesGlobal.forEach(control => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', control.control_id || control.id);

        let celdasExtra = '';
        if (modo === 'implementador') {
            celdasExtra = `<td><input type="text" class="input-responsable" value="${control.responsable || ''}"></td>
                           <td><input type="date" class="input-fecha" value="${control.fecha_limite || ''}"></td>`;
        } else if (modo === 'capacitador') {
            celdasExtra = `<td colspan="2"><input type="url" class="input-evidencia" value="${control.link_evidencia || ''}"></td>`;
        } else {
            celdasExtra = `<td><select class="status-select">
                                <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>No Iniciado</option>
                                <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                                <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Cumple</option>
                            </select></td>
                           <td><input type="text" class="input-observacion" value="${control.observaciones || ''}"></td>`;
        }

        tr.innerHTML = `<td>${control.codigo}</td><td>${control.nombre_control}</td><td>${control.categoria || 'Gral'}</td>${celdasExtra}`;
        tbody.appendChild(tr);
    });
}

// 5. GUARDAR Y PDF
async function guardarProgreso() {
    const btn = document.getElementById('btnGuardar');
    const filas = document.querySelectorAll('#controlesBody tr');
    const avances = Array.from(filas).map(f => ({
        control_id: f.dataset.id,
        estado: f.querySelector('.status-select')?.value || null,
        observaciones: f.querySelector('.input-observacion')?.value || null,
        responsable: f.querySelector('.input-responsable')?.value || null,
        fecha_limite: f.querySelector('.input-fecha')?.value || null,
        link_evidencia: f.querySelector('.input-evidencia')?.value || null
    }));

    try {
        btn.disabled = true;
        const res = await fetch('/api/controles/guardar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}`},
            body: JSON.stringify({ avances })
        });
        if (res.ok) alert("✅ Guardado con éxito");
    } catch (e) { alert("🚫 Error al conectar"); } 
    finally { btn.disabled = false; }
}

function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 
    doc.text("Reporte ISO 27001", 14, 15);
    doc.autoTable({
        html: 'table', startY: 25, theme: 'grid',
        didParseCell: (data) => {
            const input = data.cell.raw.querySelector?.('input, select');
            if (input) data.cell.text = [input.value];
        }
    });
    doc.save("Reporte.pdf");
}

async function cargarControles() {
    try {
        const res = await fetch('/api/controles', { headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`} });
        window.datosControlesGlobal = await res.json();
        renderizarTabla((localStorage.getItem('userRole') || 'auditor').toLowerCase());
    } catch (e) { console.error(e); }
}

function logout() { localStorage.clear(); window.location.href = '/'; }
