import 'package:json_annotation/json_annotation.dart';

part 'qr_response_model.g.dart';

/// Modelo de respuesta al obtener QR
@JsonSerializable()
class QRResponseModel {
  @JsonKey(name: 'qrCode')
  final String qrCode;

  @JsonKey(name: 'qrImage')
  final String qrImage; // Base64 image

  QRResponseModel({
    required this.qrCode,
    required this.qrImage,
  });

  factory QRResponseModel.fromJson(Map<String, dynamic> json) =>
      _$QRResponseModelFromJson(json);

  Map<String, dynamic> toJson() => _$QRResponseModelToJson(this);
}

/// Modelo de respuesta al verificar QR
@JsonSerializable()
class QRVerifyResponseModel {
  final bool success;
  final String message;

  QRVerifyResponseModel({
    required this.success,
    required this.message,
  });

  factory QRVerifyResponseModel.fromJson(Map<String, dynamic> json) =>
      _$QRVerifyResponseModelFromJson(json);

  Map<String, dynamic> toJson() => _$QRVerifyResponseModelToJson(this);
}
