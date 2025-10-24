// ============================================
// REGISTRO.JS - Sistema de Registro SIP
// ============================================

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('📝 Iniciando proceso de registro...');
    
    // Obtener valores directamente de los inputs
    const documento = document.querySelector('input[name="documento"]').value.trim();
    const nombres = document.querySelector('input[name="nombres"]').value.trim();
    const apellidos = document.querySelector('input[name="apellidos"]').value.trim();
    const correo = document.querySelector('input[name="correo"]').value.trim();
    const programa = document.querySelector('input[name="programa"]').value.trim();
    const contrasena = document.querySelector('input[name="contrasena"]').value;
    const confirmar_contrasena = document.querySelector('input[name="confirmar_contrasena"]').value;
    
    // 🔥 IMPORTANTE: Obtener el tipo seleccionado (aprendiz o egresado)
    const tipoSeleccionado = document.querySelector('input[name="tipo"]:checked');
    
    // ✅ VALIDACIÓN 1: Verificar que todos los campos estén llenos
    if (!documento || !nombres || !apellidos || !correo || !programa || !contrasena || !confirmar_contrasena) {
        alert('❌ Por favor completa todos los campos');
        console.error('❌ Campos faltantes detectados en el frontend');
        return;
    }
    
    // ✅ VALIDACIÓN 2: Verificar que se seleccionó un tipo
    if (!tipoSeleccionado) {
        alert('❌ Por favor selecciona si eres Aprendiz o Egresado');
        console.error('❌ No se seleccionó tipo de usuario');
        return;
    }
    
    const tipo = tipoSeleccionado.value;
    
    // ✅ VALIDACIÓN 3: Verificar que las contraseñas coincidan
    if (contrasena !== confirmar_contrasena) {
        alert('❌ Las contraseñas no coinciden');
        return;
    }
    
    // Construir objeto de datos
    const data = {
        documento: documento,
        nombres: nombres,
        apellidos: apellidos,
        correo: correo,
        programa: programa,
        contrasena: contrasena,
        confirmar_contrasena: confirmar_contrasena,
        tipo: tipo  // 🔥 Campo crítico para el sistema de roles
    };
    
    // 🔍 DEBUG: Mostrar datos que se enviarán
    console.log('📤 Datos a enviar:', {
        documento: data.documento,
        nombres: data.nombres,
        apellidos: data.apellidos,
        correo: data.correo,
        programa: data.programa,
        tipo: data.tipo,
        contrasena: '***' // No mostrar contraseña en consola
    });
    
    try {
        console.log('🌐 Enviando petición a /api/register...');
        
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📥 Respuesta recibida:', response.status);
        
        const result = await response.json();
        
        console.log('📋 Resultado:', result);
        
        if (result.success) {
            console.log('✅ Registro exitoso!');
            alert(`✅ ¡Registro exitoso!\n\nBienvenido ${data.nombres}\nRol: ${data.tipo}`);
            
            // Redirigir al login después de 1 segundo
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } else {
            console.error('❌ Error en registro:', result.message);
            alert('❌ Error: ' + result.message);
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        alert('❌ Error de conexión con el servidor. Por favor verifica que el servidor esté corriendo.');
    }
});

// ============================================
// MODAL DE TÉRMINOS Y CONDICIONES
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('modal-terms');

    // Abre el modal al hacer clic en el enlace
    if (openModalBtn) {
        openModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });
    }

    // Cierra el modal al hacer clic en la "X"
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Cierra el modal si se hace clic fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ============================================
// VALIDACIONES EN TIEMPO REAL (OPCIONAL)
// ============================================

// Validar documento (solo números)
document.querySelector('input[name="documento"]')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// Validar que las contraseñas coincidan en tiempo real
document.querySelector('input[name="confirmar_contrasena"]')?.addEventListener('input', (e) => {
    const contrasena = document.querySelector('input[name="contrasena"]').value;
    const confirmar = e.target.value;
    
    if (confirmar && contrasena !== confirmar) {
        e.target.style.borderColor = 'red';
    } else {
        e.target.style.borderColor = '';
    }
});

console.log('✅ Script de registro cargado correctamente');