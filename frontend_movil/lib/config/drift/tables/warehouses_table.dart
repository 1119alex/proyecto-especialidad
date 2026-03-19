import 'package:drift/drift.dart';

/// Tabla de Almacenes (cache local)
class Warehouses extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get remoteId => integer().nullable()();
  TextColumn get name => text()();
  TextColumn get address => text()();
  TextColumn get city => text()();
  RealColumn get latitude => real()();
  RealColumn get longitude => real()();
  DateTimeColumn get updatedAt => dateTime()();
}
