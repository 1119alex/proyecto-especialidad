import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { TransferDetail } from '../../entities/transfer-detail.entity';
import { Inventory } from '../../entities/inventory.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface RemoveProductResult {
  deleted: boolean;
  message: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Verificar si el SKU ya existe
    const existing = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existing) {
      throw new ConflictException('El SKU del producto ya está registrado');
    }

    await this.assertBarcodeAvailable(createProductDto.barcode);

    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    // Incluye el stock por almacén para que las vistas muestren existencias
    return this.productRepository.find({
      relations: ['inventory', 'inventory.warehouse'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['inventory', 'inventory.warehouse'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { sku },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Si se actualiza el SKU, verificar que no exista
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });

      if (existing) {
        throw new ConflictException('El SKU del producto ya está registrado');
      }
    }

    if (
      updateProductDto.barcode &&
      updateProductDto.barcode !== product.barcode
    ) {
      await this.assertBarcodeAvailable(updateProductDto.barcode);
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  /**
   * Elimina el producto solo si nunca fue usado. Si tiene transferencias o
   * inventario asociados se desactiva (soft delete): borrarlo rompería el
   * historial y la base lo impediría por las claves foráneas.
   */
  async remove(id: number): Promise<RemoveProductResult> {
    const product = await this.findOne(id);

    const manager = this.productRepository.manager;
    const [transferRefs, inventoryRefs] = await Promise.all([
      manager.count(TransferDetail, { where: { productId: id } }),
      manager.count(Inventory, { where: { productId: id } }),
    ]);

    if (transferRefs > 0 || inventoryRefs > 0) {
      product.isActive = false;
      await this.productRepository.save(product);
      return {
        deleted: false,
        message:
          'El producto tiene transferencias o inventario asociados, por lo que se desactivó en lugar de eliminarse',
      };
    }

    await this.productRepository.remove(product);
    return { deleted: true, message: 'Producto eliminado' };
  }

  private async assertBarcodeAvailable(
    barcode: string | null | undefined,
  ): Promise<void> {
    if (!barcode) {
      return;
    }

    const existing = await this.productRepository.findOne({
      where: { barcode },
    });

    if (existing) {
      throw new ConflictException(
        'El código de barras ya está registrado en otro producto',
      );
    }
  }
}
