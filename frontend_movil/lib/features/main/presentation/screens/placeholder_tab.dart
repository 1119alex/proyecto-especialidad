import 'package:flutter/material.dart';
import '../../../../shared/widgets/app_state_views.dart';

/// Pestaña aún no desarrollada, presentada con el sistema de diseño
/// (no un snackbar "Próximamente"). Se reemplaza por la pantalla real
/// en fases posteriores (Alertas, Inventario, Historial de viajes).
class PlaceholderTab extends StatelessWidget {
  const PlaceholderTab({
    super.key,
    required this.appBarTitle,
    required this.title,
    required this.message,
    required this.icon,
  });

  final String appBarTitle;
  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(appBarTitle)),
      body: SafeArea(
        child: EmptyStateView(title: title, message: message, icon: icon),
      ),
    );
  }
}
