import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Se incrementa cada vez que una petición devuelve 401 (sesión expirada).
/// La app escucha este provider para cerrar sesión y volver al login.
final sessionExpiredProvider = StateProvider<int>((ref) => 0);
