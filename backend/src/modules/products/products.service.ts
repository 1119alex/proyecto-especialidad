import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
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

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
