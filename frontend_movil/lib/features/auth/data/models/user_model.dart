import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/user_entity.dart';

part 'user_model.g.dart';

/// Modelo de usuario (capa de datos)
@JsonSerializable()
class UserModel {
  final int id;
  final String email;

  // Backend devuelve firstName y lastName separados
  @JsonKey(name: 'firstName')
  final String firstName;
  @JsonKey(name: 'lastName')
  final String lastName;

  final String role;
  final String? phone;
  @JsonKey(name: 'createdAt')
  final DateTime? createdAt;
  @JsonKey(name: 'updatedAt')
  final DateTime? updatedAt;

  UserModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.phone,
    this.createdAt,
    this.updatedAt,
  });

  // Helper para obtener nombre completo
  String get name => '$firstName $lastName';

  /// From JSON
  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  /// To JSON
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  /// Convertir a entidad
  UserEntity toEntity() {
    return UserEntity(
      id: id,
      email: email,
      name: name, // Usa el getter que combina firstName + lastName
      role: role,
      phone: phone,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  /// Crear desde entidad
  factory UserModel.fromEntity(UserEntity entity) {
    // Dividir el nombre completo en firstName y lastName
    final nameParts = entity.name.split(' ');
    final firstName = nameParts.isNotEmpty ? nameParts.first : '';
    final lastName =
        nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';

    return UserModel(
      id: entity.id,
      email: entity.email,
      firstName: firstName,
      lastName: lastName,
      role: entity.role,
      phone: entity.phone,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
