import 'package:drift/drift.dart';

/// Tabla de Usuarios (cache local)
class Users extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get remoteId => integer().nullable()(); // ID del backend
  TextColumn get name => text()();
  TextColumn get email => text()();
  TextColumn get role => text()(); // ADMIN, TRANSPORTISTA, ENC_ORIGEN, ENC_DESTINO
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  BoolColumn get needsSync => boolean().withDefault(const Constant(false))();
}
