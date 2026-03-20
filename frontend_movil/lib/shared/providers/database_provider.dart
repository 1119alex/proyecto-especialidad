import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../config/drift/database.dart';

part 'database_provider.g.dart';

/// Provider de la base de datos local (Drift)
@Riverpod(keepAlive: true)
AppDatabase database(DatabaseRef ref) {
  return AppDatabase();
}
