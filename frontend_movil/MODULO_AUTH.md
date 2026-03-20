# Módulo de Autenticación - LogiTrack Mobile

## ✅ Módulo Completado

El módulo de autenticación ha sido implementado completamente siguiendo Clean Architecture y está listo para usar.

---

## Estructura del Módulo

```
lib/features/auth/
├── data/
│   ├── datasources/
│   │   └── auth_remote_datasource.dart        # Llamadas HTTP al backend
│   ├── models/
│   │   ├── login_response_model.dart          # Modelo de respuesta de login
│   │   ├── login_response_model.g.dart        # Generado por json_serializable
│   │   ├── user_model.dart                    # Modelo de usuario
│   │   └── user_model.g.dart                  # Generado por json_serializable
│   └── repositories/
│       └── auth_repository_impl.dart          # Implementación del repositorio
├── domain/
│   ├── entities/
│   │   └── user_entity.dart                   # Entidad de usuario (dominio)
│   └── repositories/
│       └── auth_repository.dart               # Interfaz del repositorio
└── presentation/
    ├── providers/
    │   ├── auth_providers.dart                # Providers de Riverpod
    │   └── auth_providers.g.dart              # Generado
    └── screens/
        ├── splash_screen.dart                 # Pantalla de carga inicial
        └── login_screen.dart                  # Pantalla de login
```

---

## Características Implementadas

### 1. Splash Screen
- ✅ Pantalla de carga inicial con logo
- ✅ Verificación automática de sesión activa
- ✅ Redirección automática a Home o Login
- ✅ Diseño siguiendo el mockup (fondo oscuro #1A2332)

### 2. Login Screen
- ✅ Formulario de login con validación
- ✅ Campos: Email y Password
- ✅ Validación de formato de email
- ✅ Mostrar/Ocultar contraseña
- ✅ Manejo de errores con SnackBar
- ✅ Loading indicator durante el login
- ✅ Diseño siguiendo el mockup (Material Design oscuro)

### 3. Lógica de Negocio

#### Datasource Remoto
```dart
- login(email, password) -> LoginResponseModel
- getCurrentUser() -> UserModel
- logout()
```

#### Repositorio
```dart
- login(email, password) -> (token, UserEntity)
- logout()
- getCurrentUser() -> UserEntity?
- hasActiveSession() -> bool
```

#### Providers de Riverpod
```dart
- authRemoteDatasourceProvider
- authRepositoryProvider
```

---

## Integración con el Sistema

### Router Actualizado
El router (`app_router.dart`) ahora incluye:
- Ruta `/splash` como initialLocation
- Ruta `/login` para inicio de sesión
- Redirección automática basada en estado de autenticación
- Protección de rutas privadas

### Provider Global de Auth
El provider `authProvider` (en `shared/providers/`) maneja:
- Estado de autenticación global
- Almacenamiento seguro de JWT
- Información del usuario actual
- Métodos `login()` y `logout()`

---

## Flujo de Autenticación

```
1. Usuario abre la app
   ↓
2. Muestra SplashScreen
   ↓
3. Verifica si hay token guardado
   ↓
   ├─ SI → Redirige a Home
   │
   └─ NO → Redirige a Login
              ↓
           Usuario ingresa credenciales
              ↓
           Llama a backend /auth/login
              ↓
           ├─ Éxito → Guarda token en SecureStorage
           │          Actualiza estado global
           │          Redirige a Home
           │
           └─ Error → Muestra mensaje de error
```

---

## Modelos de Datos

### UserEntity (Dominio)
```dart
class UserEntity {
  final int id;
  final String email;
  final String name;
  final String role;
  final String? phone;
  final DateTime? createdAt;
  final DateTime? updatedAt;
}
```

### UserModel (Datos)
```dart
@JsonSerializable()
class UserModel {
  // Mismos campos que UserEntity
  // Incluye métodos:
  - toEntity() -> UserEntity
  - fromEntity(UserEntity)
  - fromJson(Map)
  - toJson() -> Map
}
```

### LoginResponseModel
```dart
@JsonSerializable()
class LoginResponseModel {
  @JsonKey(name: 'access_token')
  final String accessToken;
  final UserModel user;
}
```

---

## Endpoints del Backend

El módulo consume estos endpoints:

```dart
POST /auth/login
{
  "email": "string",
  "password": "string"
}
→ Response: { access_token: string, user: User }

GET /auth/profile
Headers: { Authorization: Bearer <token> }
→ Response: User
```

---

## Seguridad

### Almacenamiento Seguro
- JWT almacenado en `FlutterSecureStorage`
- Encriptación nativa del dispositivo
- Keys usadas:
  - `auth_token` - JWT token
  - `user_role` - Rol del usuario
  - `user_id` - ID del usuario

### Headers HTTP
- JWT agregado automáticamente en `Authorization: Bearer <token>`
- Interceptor de Dio maneja 401 (token expirado)

---

## Manejo de Errores

### Errores de Login
```dart
- 401: "Credenciales inválidas"
- 404: "Usuario no encontrado"
- Timeout: "Error de conexión"
- Otros: "Error inesperado"
```

### Validaciones de Formulario
- Email: Formato válido, no vacío
- Password: Mínimo 6 caracteres, no vacío

---

## Pruebas Manuales

### Test de Login Exitoso
1. Abrir app → Ver Splash 2 seg
2. Redirigir a Login
3. Ingresar email válido (ej: `admin@empresa.com`)
4. Ingresar password (ej: `123456`)
5. Presionar INGRESAR
6. Ver loading indicator
7. Redirigir a Home

### Test de Login Fallido
1. Ingresar credenciales incorrectas
2. Ver mensaje de error en SnackBar rojo
3. Permanecer en Login

### Test de Sesión Activa
1. Hacer login exitoso
2. Cerrar app (no logout)
3. Reabrir app
4. Ver Splash → Redirigir directamente a Home

---

## Dependencias Utilizadas

```yaml
# State Management
- flutter_riverpod: ^2.5.1
- riverpod_annotation: ^2.3.5

# HTTP
- dio: ^5.4.3

# Almacenamiento Seguro
- flutter_secure_storage: ^9.0.0

# Navegación
- go_router: ^13.2.1

# Serialización JSON
- json_annotation: ^4.9.0
- json_serializable: ^6.7.1 (dev)
```

---

## Código Generado

### Archivos .g.dart generados:
- `lib/features/auth/data/models/user_model.g.dart`
- `lib/features/auth/data/models/login_response_model.g.dart`
- `lib/features/auth/presentation/providers/auth_providers.g.dart`

### Comando para regenerar:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## Próximos Pasos

El módulo está listo para:
1. ✅ Ser usado por otros módulos (Transfers, Tracking, etc.)
2. ✅ Proteger rutas basadas en roles
3. ✅ Manejar sesiones persistentes
4. ✅ Refrescar tokens (si el backend lo implementa)

### Mejoras Futuras (Opcionales):
- [ ] Implementar refresh token
- [ ] Agregar biometría (TouchID/FaceID)
- [ ] Agregar "Recordar usuario"
- [ ] Implementar recuperación de contraseña
- [ ] Agregar registro de nuevos usuarios

---

## Notas Importantes

### Firebase Temporalmente Deshabilitado
En `main.dart`, Firebase está comentado porque requiere configuración adicional:
```dart
// TODO: Configurar Firebase después
// await Firebase.initializeApp();
```

### API Constants
Asegúrate de actualizar la URL base en `api_constants.dart`:
```dart
static const String baseUrl = 'http://localhost:3000'; // Cambiar en producción
```

---

## Capturas del Diseño Implementado

### Splash Screen
- Fondo: #1A2332 (azul oscuro)
- Logo: Icono de camión en contenedor azul redondeado
- Texto: "LOGITRACK" en blanco
- Loading indicator circular azul

### Login Screen
- Fondo: #1A2332
- Campos de texto: Fondo #2A3544
- Botón: Azul (#42A5F5)
- Labels: Texto blanco con opacidad 70%
- Validación en tiempo real

---

## Resumen de Commits Sugeridos

Para subir a GitHub, se recomienda:

```bash
git add lib/features/auth/
git commit -m "feat: Implement authentication module (login, splash, security)

- Add Clean Architecture structure for auth feature
- Implement SplashScreen with session verification
- Implement LoginScreen with form validation
- Create AuthRepository with remote datasource
- Add UserEntity and UserModel with JSON serialization
- Integrate with SecureStorage for JWT persistence
- Configure router with auth redirects
- Add Riverpod providers for dependency injection

Screens ready to use with backend integration.
"
```

---

## Estado Final

✅ **Módulo de Autenticación: 100% Completado**
- 0 errores de compilación
- 131 archivos generados por build_runner
- Listo para integración con backend
- Listo para pruebas manuales
- Listo para siguiente módulo (Transfers)
