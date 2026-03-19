import 'package:drift/drift.dart';

/// Tabla de Logs de Tracking GPS
class TrackingLogs extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get transferId => integer()(); // Referencia a la transferencia
  RealColumn get latitude => real()();
  RealColumn get longitude => real()();
  RealColumn get accuracy => real().nullable()(); // Precisión en metros
  RealColumn get speed => real().nullable()(); // Velocidad en m/s
  DateTimeColumn get timestamp => dateTime()();
  BoolColumn get needsSync => boolean().withDefault(const Constant(false))();
}
