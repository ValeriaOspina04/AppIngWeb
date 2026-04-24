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

    if (roleId === 'capacitador') {
        thEstado.textContent = 'Enfoque: Enseñar';
        thAccion.textContent = 'Evidencia / Material';
    } else if (roleId === 'implementador') {
        thEstado.textContent = 'Enfoque: Hacer';
        thAccion.textContent = 'Fecha Límite';
    } else {
        thEstado.textContent = 'Estado';
        thAccion.textContent = 'Observaciones';
    }

    renderizarTabla(roleId);
}

// 4. DIBUJAR LA TABLA (Sin emojis para evitar errores de PDF y DB)
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
                        <option value="No Iniciado" ${control.estado === 'No Iniciado' ? 'selected' : ''}>No Iniciado</option>
                        <option value="En Proceso" ${control.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Cumple" ${control.estado === 'Cumple' ? 'selected' : ''}>Cumplido</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="input-responsable" value="${control.responsable || ''}" placeholder="Responsable">
                    <input type="date" class="input-fecha" value="${control.fecha_limite || ''}" style="display:block; margin-top:5px;">
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
                <td><input type="url" class="input-evidencia" value="${control.link_evidencia || ''}" placeholder="Link material"></td>`;
        } else {
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

        tr.innerHTML = `<td>${control.codigo}</td><td>${control.nombre_control}</td><td>${control.categoria || 'Gral'}</td>${celdasExtra}`;
        tbody.appendChild(tr);
    });
}

// 5. GUARDAR DATOS (Corregido para evitar "Datos Inválidos")
async function guardarProgreso() {
    const btn = document.getElementById('btnGuardar');
    const filas = document.querySelectorAll('#controlesBody tr');
    const token = localStorage.getItem('token');

    const controles = Array.from(filas).map(f => ({
        control_id: parseInt(f.dataset.id),
        estado: f.querySelector('.status-select')?.value || 'No Iniciado',
        observaciones: f.querySelector('.input-observacion')?.value || null,
        responsable: f.querySelector('.input-responsable')?.value || null,
        fecha_limite: (fechaVal && fechaVal.trim() !== "") ? fechaVal : null,
        link_evidencia: f.querySelector('.input-evidencia')?.value || null
    }));

    try {
        btn.disabled = true;
        btn.textContent = "Conectando...";

        // USA LA RUTA RELATIVA SI ESTÁN EN EL MISMO DOMINIO
        const res = await fetch('/api/controles/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ controles })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ Guardado: " + data.mensaje);
        } else {
            alert("⚠️ Servidor dice: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error de Fetch:", error);
        // SI SALE ESTE ALERT, ES QUE EL SERVIDOR NO RESPONDIÓ (ESTÁ CAÍDO O BLOQUEADO)
        alert("🚫 No hay conexión con el servidor. Revisa la consola (F12).");
    } finally {
        btn.disabled = false;
        btn.textContent = "💾 Guardar progreso";
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
