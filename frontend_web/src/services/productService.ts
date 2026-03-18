import api from './api';
import { Product, CreateProductDto, UpdateProductDto } from '../types';

export const productService = {
  // Obtener todos los productos
  getAll: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products');
    return response.data;
  },

  // Obtener un producto por ID
  getById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  // Crear un nuevo producto
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  // Actualizar un producto
  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  // Eliminar un producto
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
