window.datosControlesGlobal = [];

// ==========================================
// 1. FUNCIÓN: GENERAR REPORTE PDF
// ==========================================
function generarPDF() {
    const { jsPDF } = window.jspdf;
    // Usamos 'l' (landscape/horizontal) para que quepan todas las columnas de los roles
    const doc = new jsPDF('l', 'mm', 'a4'); 

    // Configuración estética del reporte
    doc.setFontSize(18);
    doc.setTextColor(19, 190, 216); // Tu azul institucional
    doc.text("Reporte de Cumplimiento ISO 27001", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Empresa: ${localStorage.getItem('empresaNombre') || 'Gestión ISO'}`, 14, 22);
    doc.text(`Auditor Responsable: ${localStorage.getItem('userName')}`, 14, 27);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 14, 32);

    // Generar la tabla automáticamente desde el HTML
    doc.autoTable({
        html: '.checklist-table', // Selecciona tu tabla por clase
        startY: 40,
        theme: 'grid',
        headStyles: { 
            fillColor: [19, 190, 216], 
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: { fontSize: 8, cellPadding: 3 },
        // Esta parte convierte los inputs y selects en texto plano para el PDF
        didParseCell: function(data) {
            const element = data.cell.raw;
            if (element && element.querySelector) {
                const input = element.querySelector('input');
                const select = element.querySelector('select');
                if (input) data.cell.text = [input.value];
                if (select) data.cell.text = [select.value];
            }
        }
    });

    // Descargar el archivo
    doc.save(`Reporte_ISO27001_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ==========================================
// 2. FUNCIÓN: GUARDAR PROGRESO (AVANCES)
// ==========================================
async function guardarProgreso() {
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerHTML;
    const tbody = document.getElementById('controlesBody');
    const filas = tbody.querySelectorAll('tr');
    
    if (filas.length === 0) return alert("No hay datos para guardar.");

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
            setTimeout(() => {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }, 2000);
            alert("✅ Progreso guardado correctamente.");
        } else {
            throw new Error("Error en el servidor");
        }
    } catch (error) {
        alert("❌ Error al guardar.");
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
}

// ==========================================
// 3. RENDERIZADO Y NAVEGACIÓN
// ==========================================
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
                <td><input type="text" class="input-responsable" value="${control.responsable || ''}"></td>
                <td><input type="date" class="input-fecha" value="${control.fecha_limite || ''}"></td>`;
        } else if (modo === 'capacitador') {
            celdasExtra = `
                <td colspan="2"><input type="url" class="input-evidencia" value="${control.link_evidencia || ''}" placeholder="Link Drive/Docs"></td>`;
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
            ${celdasExtra} 
        `;
        tbody.appendChild(tr);
    });
}

function showTab(roleId) {
    const rolUsuario = (localStorage.getItem('userRole') || '').toLowerCase();
    if (rolUsuario !== 'admin' && rolUsuario !== roleId) return;

    // Lógica de visibilidad de pestañas
    document.querySelectorAll('.role-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(roleId);
    if (target) target.style.display = 'block';
    document.getElementById(`tab-${roleId}`)?.classList.add('active');

    // Cambiar etiquetas de las columnas
    const thEstado = document.getElementById('th-estado');
    const thAccion = document.getElementById('th-accion');

    if (roleId === 'capacitador') {
        thEstado.textContent = 'Evidencias'; thAccion.textContent = 'Link de Acceso';
    } else if (roleId === 'implementador') {
        thEstado.textContent = 'Responsable'; thAccion.textContent = 'Fecha Límite';
    } else {
        thEstado.textContent = 'Estado'; thAccion.textContent = 'Observaciones';
    }

    renderizarTabla(roleId);
}

// Carga inicial
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) { window.location.href = '/'; return; }
    
    document.getElementById('userNameDisplay').textContent = localStorage.getItem('userName');
    cargarControles();
});

async function cargarControles() {
    const response = await fetch('/api/controles', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    window.datosControlesGlobal = await response.json();
    showTab(localStorage.getItem('userRole').toLowerCase());
}
