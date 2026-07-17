import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../../entities/product.entity';
import { TransferDetail } from '../../entities/transfer-detail.entity';
import { Inventory } from '../../entities/inventory.entity';

function makeProduct(partial: Partial<Product> = {}): Product {
  return {
    id: 1,
    sku: 'SKU-1',
    barcode: null,
    name: 'Producto 1',
    unit: 'UNIDAD',
    minStock: 0,
    isActive: true,
    ...partial,
  } as Product;
}

describe('ProductsService', () => {
  let service: ProductsService;

  const mockManager = {
    count: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (p: any) => p),
    remove: jest.fn(async (p: any) => p),
    manager: mockManager,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('create', () => {
    it('rechaza un SKU ya registrado', async () => {
      mockProductRepository.findOne.mockResolvedValueOnce(makeProduct());

      await expect(
        service.create({ sku: 'SKU-1', name: 'Otro', unit: 'UNIDAD' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza un código de barras ya registrado', async () => {
      mockProductRepository.findOne
        .mockResolvedValueOnce(null) // búsqueda por SKU
        .mockResolvedValueOnce(makeProduct({ barcode: '750123' })); // por barcode

      await expect(
        service.create({
          sku: 'SKU-2',
          name: 'Otro',
          unit: 'UNIDAD',
          barcode: '750123',
        }),
      ).rejects.toThrow(/código de barras/);
    });

    it('crea el producto cuando SKU y barcode están libres', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      const result = await service.create({
        sku: 'SKU-3',
        name: 'Nuevo',
        unit: 'UNIDAD',
        barcode: null, // '' ya normalizado a null por el DTO
      });

      expect(mockProductRepository.save).toHaveBeenCalledTimes(1);
      expect(result.sku).toBe('SKU-3');
    });

    it('no consulta unicidad de barcode cuando viene null', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await service.create({
        sku: 'SKU-4',
        name: 'Sin barcode',
        unit: 'UNIDAD',
        barcode: null,
      });

      // Solo la búsqueda por SKU: dos productos sin barcode no colisionan
      expect(mockProductRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('rechaza cambiar el barcode a uno usado por otro producto', async () => {
      mockProductRepository.findOne
        .mockResolvedValueOnce(makeProduct({ id: 1, barcode: 'AAA' })) // findOne(id)
        .mockResolvedValueOnce(makeProduct({ id: 2, barcode: 'BBB' })); // por barcode

      await expect(service.update(1, { barcode: 'BBB' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('lanza 404 si el producto no existe', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('desactiva en lugar de eliminar cuando el producto tiene referencias', async () => {
      const product = makeProduct();
      mockProductRepository.findOne.mockResolvedValue(product);
      mockManager.count
        .mockResolvedValueOnce(3) // transfer_details
        .mockResolvedValueOnce(0); // inventory

      const result = await service.remove(1);

      expect(result.deleted).toBe(false);
      expect(product.isActive).toBe(false);
      expect(mockProductRepository.save).toHaveBeenCalledWith(product);
      expect(mockProductRepository.remove).not.toHaveBeenCalled();
    });

    it('elimina físicamente cuando el producto nunca fue usado', async () => {
      const product = makeProduct();
      mockProductRepository.findOne.mockResolvedValue(product);
      mockManager.count.mockResolvedValue(0);

      const result = await service.remove(1);

      expect(result.deleted).toBe(true);
      expect(mockProductRepository.remove).toHaveBeenCalledWith(product);
      expect(mockManager.count).toHaveBeenCalledWith(TransferDetail, {
        where: { productId: 1 },
      });
      expect(mockManager.count).toHaveBeenCalledWith(Inventory, {
        where: { productId: 1 },
      });
    });
  });
});
