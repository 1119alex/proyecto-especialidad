// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'qr_response_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QRResponseModel _$QRResponseModelFromJson(Map<String, dynamic> json) =>
    QRResponseModel(
      qrCode: json['qrCode'] as String,
      qrImage: json['qrImage'] as String,
    );

Map<String, dynamic> _$QRResponseModelToJson(QRResponseModel instance) =>
    <String, dynamic>{
      'qrCode': instance.qrCode,
      'qrImage': instance.qrImage,
    };

QRVerifyResponseModel _$QRVerifyResponseModelFromJson(
        Map<String, dynamic> json) =>
    QRVerifyResponseModel(
      success: json['success'] as bool,
      message: json['message'] as String,
    );

Map<String, dynamic> _$QRVerifyResponseModelToJson(
        QRVerifyResponseModel instance) =>
    <String, dynamic>{
      'success': instance.success,
      'message': instance.message,
    };
