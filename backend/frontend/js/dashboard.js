window.datosControlesGlobal = [];

// 1. CARGA INICIAL (Restauramos el nombre y el rol en pantalla)
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // --- RESTAURADO: Mostrar datos en el header ---
    const nombreElemento = document.getElementById('userNameDisplay');
    const rolElemento = document.getElementById('userRoleDisplay');
    
    if (nombreElemento) nombreElemento.textContent = localStorage.getItem('userName') || 'Usuario';
    if (rolElemento) rolElemento.textContent = localStorage.getItem('userRole') || 'Rol';

    cargarControles();
    restringirAccesosPorRol(); // Ejecuta la lógica de ocultar/mostrar botones según rol
});

// 2. FUNCIÓN DE RENDERIZADO (Con las clases de captura correctas)
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
                <td><input type="text" class="input-responsable" value="${control.responsable || ''}" placeholder="Nombre..."></td>
                <td><input type="date" class="input-fecha" value="${control.fecha_limite || ''}"></td>`;
        } else if (modo === 'capacitador') {
            celdasExtra = `
                <td colspan="2"><input type="url" class="input-evidencia" placeholder="Link de evidencia..." value="${control.link_evidencia || ''}"></td>`;
        } else { // Auditor por defecto
            celdasExtra = `
                <td>
                    <select class="status-select">
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>No Iniciado</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Cumple</option>
                    </select>
                </td>
                <td><input type="text" class="input-observacion" value="${control.observaciones || ''}" placeholder="Obs..."></td>`;
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

// 3. GENERAR PDF (Horizontal para el reporte final)
function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); 

    doc.setFontSize(16);
    doc.text("Reporte de Cumplimiento ISO 27001", 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Generado por: ${localStorage.getItem('userName')}`, 14, 25);

    doc.autoTable({
        html: '.checklist-table',
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [19, 190, 216] },
        didParseCell: function(data) {
            // Esto asegura que los valores de los inputs salgan en el PDF
            const input = data.cell.raw.querySelector?.('input, select');
            if (input) data.cell.text = [input.value];
        }
    });

    doc.save("Reporte_ISO27001.pdf");
}

// 4. GUARDAR PROGRESO (Corregido para el endpoint de Render)
async function guardarProgreso() {
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerHTML;
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
        btn.innerHTML = '<span>⏳</span> Guardando...';
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
            btn.innerHTML = '<span>✅</span> ¡Éxito!';
            setTimeout(() => { btn.innerHTML = textoOriginal; btn.disabled = false; }, 2000);
            alert("¡Progreso guardado!");
        } else {
            const data = await response.json();
            alert("Error: " + data.mensaje);
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    } catch (error) {
        alert("Error de conexión");
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// --- RESTO DE FUNCIONES DE NAVEGACIÓN ---
function showTab(roleId) {
    const rolUsuario = (localStorage.getItem('userRole') || '').toLowerCase();
    if (rolUsuario !== 'admin' && rolUsuario !== roleId) return;

    document.querySelectorAll('.role-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const seccion = document.getElementById(roleId);
    if (seccion) seccion.style.display = 'block';
    document.getElementById(`tab-${roleId}`)?.classList.add('active');

    renderizarTabla(roleId);
}

async function cargarControles() {
    try {
        const response = await fetch('/api/controles', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const controles = await response.json();
        window.datosControlesGlobal = controles;
        
        const rolActual = (localStorage.getItem('userRole') || 'auditor').toLowerCase();
        renderizarTabla(rolActual);
    } catch (e) { console.error(e); }
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}
