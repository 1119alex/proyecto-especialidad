import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../config/router/app_router.dart';
import '../../../transfers/presentation/screens/transfers_list_screen.dart';

/// Pantalla principal con Bottom Navigation
class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  int _selectedIndex = 0;

  // Lista de pantallas para cada tab
  final List<Widget> _screens = [
    const TransfersListScreen(), // Inicio (Viajes)
    const TransfersListScreen(), // Viajes (duplicado por ahora)
    const Center(child: Text('Alertas')), // Alertas
    const Center(child: Text('Perfil')), // Perfil
  ];

  void _onItemTapped(int index) {
    // Si presiona el botón del centro (QR Scanner)
    if (index == 2) {
      context.push(AppRoutes.qrScanner);
      return;
    }

    setState(() {
      _selectedIndex = index > 2 ? index - 1 : index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: _buildBottomNavigation(),
    );
  }

  Widget _buildBottomNavigation() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // Inicio
              _buildNavItem(
                icon: Icons.home,
                label: 'Inicio',
                isActive: _selectedIndex == 0,
                onTap: () => _onItemTapped(0),
              ),

              // Viajes
              _buildNavItem(
                icon: Icons.local_shipping_outlined,
                label: 'Viajes',
                isActive: _selectedIndex == 1,
                onTap: () => _onItemTapped(1),
              ),

              // QR Scanner (Centro - Destacado)
              _buildQRScannerButton(),

              // Alertas
              _buildNavItem(
                icon: Icons.notifications_outlined,
                label: 'Alertas',
                isActive: _selectedIndex == 2,
                onTap: () => _onItemTapped(3),
              ),

              // Perfil
              _buildNavItem(
                icon: Icons.person_outline,
                label: 'Perfil',
                isActive: _selectedIndex == 3,
                onTap: () => _onItemTapped(4),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: isActive
                    ? const Color(0xFF3B82F6)
                    : const Color(0xFF94A3B8),
                size: 24,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isActive
                      ? const Color(0xFF3B82F6)
                      : const Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQRScannerButton() {
    return Container(
      width: 64,
      height: 64,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF3B82F6),
            Color(0xFF2563EB),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withOpacity(0.4),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _onItemTapped(2),
          borderRadius: BorderRadius.circular(20),
          child: const Icon(
            Icons.qr_code_scanner,
            color: Colors.white,
            size: 32,
          ),
        ),
      ),
    );
  }
}
