// --- LÓGICA DE LOGIN ---
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const credentials = {
            correo: document.getElementById('correo').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar sesión (Confidencialidad) [cite: 82, 86]
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.rol);
                localStorage.setItem('userName', data.nombre);

                // Redirección por roles [cite: 33, 34]
                window.location.href = 'dashboard.html';
            } else {
                alert("Error: " + data.mensaje);
            }
        } catch (error) {
            console.error("Error en la conexión:", error);
        }
    });
}

// --- LÓGICA DE REGISTRO ---
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Iniciando proceso de registro...");

        // Captura de datos solicitados: Empresa, Representante y Tipo [cite: 10]
        const data = {
            nombre: document.getElementById('nombre').value,
            correo: document.getElementById('correo').value,
            password: document.getElementById('password').value,
            rol: document.getElementById('rol').value,
            nombre_empresa: document.getElementById('nombre_empresa').value,
            representante_legal: document.getElementById('representante_legal').value,
            tipo_empresa: document.getElementById('tipo_empresa').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert("Empresa registrada con éxito. Ahora puedes iniciar sesión.");
                window.location.href = 'login.html';
                
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.mensaje);
            }
        } catch (error) {
            console.error("Error al registrar:", error);
        }
    });
}
