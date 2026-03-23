/// Entidad de usuario (dominio)
class UserEntity {
  final int id;
  final String email;
  final String name;
  final String role;
  final String? phone;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final int? warehouseId;
  final String? warehouseName;

  const UserEntity({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.createdAt,
    this.updatedAt,
    this.warehouseId,
    this.warehouseName,
  });

  UserEntity copyWith({
    int? id,
    String? email,
    String? name,
    String? role,
    String? phone,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? warehouseId,
    String? warehouseName,
  }) {
    return UserEntity(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      warehouseId: warehouseId ?? this.warehouseId,
      warehouseName: warehouseName ?? this.warehouseName,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is UserEntity &&
        other.id == id &&
        other.email == email &&
        other.name == name &&
        other.role == role &&
        other.phone == phone &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt &&
        other.warehouseId == warehouseId &&
        other.warehouseName == warehouseName;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        email.hashCode ^
        name.hashCode ^
        role.hashCode ^
        phone.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode ^
        warehouseId.hashCode ^
        warehouseName.hashCode;
  }
}
