import 'package:drift/drift.dart';

/// Tabla de Vehículos (cache local)
class Vehicles extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get remoteId => integer().nullable()();
  TextColumn get plate => text()();
  TextColumn get model => text()();
  RealColumn get capacity => real()();
  BoolColumn get available => boolean().withDefault(const Constant(true))();
  DateTimeColumn get updatedAt => dateTime()();
}
