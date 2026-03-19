import 'package:drift/drift.dart';

/// Tabla de Productos (cache local)
class Products extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get remoteId => integer().nullable()();
  TextColumn get name => text()();
  TextColumn get sku => text()();
  TextColumn get unit => text()(); // unidad de medida
  TextColumn get description => text().nullable()();
  DateTimeColumn get updatedAt => dateTime()();
}
