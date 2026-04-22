// --- LÓGICA DE LOGIN ---
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const credentials = {
            // Verifica si en tu backend usas 'correo' o 'email'
            correo: document.getElementById('correo').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            // URL RELATIVA para Render
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.rol);
                localStorage.setItem('userName', data.nombre);

                // Redirección a la ruta limpia de Render
                window.location.href = '/dashboard';
            } else {
                alert("Error: " + data.mensaje);
            }
        } catch (error) {
            console.error("Error en la conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    });
}

// --- LÓGICA DE REGISTRO ---
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

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
            // URL RELATIVA para Render (Sin localhost)
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert("Registro exitoso. Ahora puedes iniciar sesión.");
                window.location.href = '/'; // Va al login
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.mensaje);
            }
        } catch (error) {
            console.error("Error al registrar:", error);
        }
    });
}
