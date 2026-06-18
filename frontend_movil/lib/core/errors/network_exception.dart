/// Error de conectividad: el dispositivo no pudo alcanzar el backend.
///
/// Se distingue de los demás errores (401, 403, 404, validación...) para que
/// la capa de repositorio pueda decidir caer al caché local (offline-first)
/// solo cuando el problema es de red, y no enmascarar errores legítimos.
class NetworkException implements Exception {
  final String message;

  const NetworkException([
    this.message =
        'Sin conexión con el servidor. Mostrando datos guardados localmente.',
  ]);

  @override
  String toString() => message;
}
