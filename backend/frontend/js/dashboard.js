window.datosControlesGlobal = [];

// 1. GENERAR REPORTE PDF
async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 

    doc.setFontSize(16);
    doc.setTextColor(19, 190, 216);
    doc.text("Reporte ISO 27001 - Gestión de Controles", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado por: ${localStorage.getItem('userName') || 'Usuario'}`, 14, 22);

    doc.autoTable({
        html: 'table',
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [19, 190, 216] },
        styles: { fontSize: 7 },
        didParseCell: function(data) {
            const el = data.cell.raw;
            if (el && el.querySelector) {
                const val = el.querySelector('input')?.value || el.querySelector('select')?.value;
                if (val !== undefined) data.cell.text = [val];
            }
        }
    });

    doc.save("Reporte_ISO27001.pdf");
}

// 2. RENDERIZAR TABLA (Implementador = Hacer)
function renderizarTabla(modo) {
    const tbody = document.getElementById('controlesBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    window.datosControlesGlobal.forEach(control => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', control.control_id || control.id);

        let celdasExtra = '';
        
        if (modo === 'implementador') {
            // El implementador pone quién LO HACE y CUÁNDO
            celdasExtra = `
                <td><input type="text" class="input-responsable" value="${control.responsable || ''}" placeholder="Quién lo configura..."></td>
                <td><input type="date" class="input-fecha" value="${control.fecha_limite || ''}"></td>`;
        } else if (modo === 'capacitador') {
            // El capacitador pone el LINK de lo que ENSEÑÓ
            celdasExtra = `
                <td colspan="2"><input type="url" class="input-evidencia" placeholder="Link de capacitación..." value="${control.link_evidencia || ''}"></td>`;
        } else {
            // El auditor ve el ESTADO legal
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>No Iniciado</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Cumple</option>
                    </select>
                </td>
                <td><input type="text" class="input-observacion" value="${control.observaciones || ''}" placeholder="Nota de auditoría"></td>`;
        }

        tr.innerHTML = `
            <td>${control.codigo}</td>
            <td>${control.nombre_control}</td>
            <td>${control.categoria || 'General'}</td>
            ${celdasExtra} 
        `;
        tbody.appendChild(tr);
    });
}

// 3. GUARDAR PROGRESO
async function guardarProgreso() {
    const btn = document.getElementById('btnGuardar');
    const tbody = document.getElementById('controlesBody');
    const filas = tbody.querySelectorAll('tr');

    const avances = Array.from(filas).map(fila => ({
        control_id: fila.dataset.id, 
        estado: fila.querySelector('.status-select')?.value || null,
        observaciones: fila.querySelector('.input-observacion')?.value || null,
        responsable: fila.querySelector('.input-responsable')?.value || null,
        fecha_limite: fila.querySelector('.input-fecha')?.value || null,
        link_evidencia: fila.querySelector('.input-evidencia')?.value || null
    }));

    try {
        btn.disabled = true;
        const response = await fetch('/api/controles/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ avances })
        });

        if (response.ok) {
            alert("✅ Guardado correctamente");
        } else {
            const err = await response.json();
            alert("❌ Error: " + err.mensaje);
        }
    } catch (e) {
        alert("🚫 Error de conexión");
    } finally {
        btn.disabled = false;
    }
}

// 4. CAMBIO DE ROL
function showTab(roleId) {
    const rolActual = (localStorage.getItem('userRole') || '').toLowerCase();
    if (rolActual !== 'admin' && rolActual !== roleId) return;

    document.querySelectorAll('.role-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const seccion = document.getElementById(roleId);
    if (seccion) seccion.style.display = 'block';
    
    document.getElementById(`tab-${roleId}`)?.classList.add('active');

    const thEstado = document.getElementById('th-estado');
    const thAccion = document.getElementById('th-accion');

    if (roleId === 'capacitador') {
        thEstado.textContent = 'Enfoque: Enseñar'; 
        thAccion.textContent = 'Material / Evidencia';
    } else if (roleId === 'implementador') {
        thEstado.textContent = 'Enfoque: Hacer'; 
        thAccion.textContent = 'Fecha Límite';
    } else {
        thEstado.textContent = 'Estado'; 
        thAccion.textContent = 'Observaciones';
    }

    renderizarTabla(roleId);
}

// 5. INICIO AL CARGAR
document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');

    if (document.getElementById('userNameDisplay')) 
        document.getElementById('userNameDisplay').textContent = userName || 'Usuario';
    
    if (document.getElementById('userRoleDisplay')) 
        document.getElementById('userRoleDisplay').textContent = userRole || 'Rol';

    cargarControles();
});

async function cargarControles() {
    try {
        const res = await fetch('/api/controles', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        window.datosControlesGlobal = await res.json();
        const rol = (localStorage.getItem('userRole') || 'auditor').toLowerCase();
        showTab(rol);
    } catch (e) {
        console.error("Error:", e);
    }
}
