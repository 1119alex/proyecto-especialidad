import 'package:json_annotation/json_annotation.dart';
import 'user_model.dart';

part 'login_response_model.g.dart';

/// Modelo de respuesta de login
@JsonSerializable()
class LoginResponseModel {
  // Backend devuelve "accessToken" en camelCase
  @JsonKey(name: 'accessToken')
  final String accessToken;
  final UserModel user;

  LoginResponseModel({
    required this.accessToken,
    required this.user,
  });

  /// From JSON
  factory LoginResponseModel.fromJson(Map<String, dynamic> json) =>
      _$LoginResponseModelFromJson(json);

  /// To JSON
  Map<String, dynamic> toJson() => _$LoginResponseModelToJson(this);
}
