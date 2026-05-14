export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  reference: string;
  avatar_url: string;
  role: 'user' | 'admin';
  has_discount: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_percent: number;
  stock: number;
  category: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  address: string;
  reference: string;
  phone: string;
  payment_method: 'yape' | 'plin' | 'tarjeta' | 'efectivo';
  status: 'pendiente' | 'en_camino' | 'entregado';
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  subtotal: number;
}

export interface Discount {
  id: string;
  code: string;
  description: string;
  percent: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Alert {
  id: string;
  product_id: string | null;
  type: 'low_stock' | 'out_of_stock' | 'info';
  message: string;
  is_read: boolean;
  created_at: string;
  product?: Product;
}

export type Page =
  | 'home'
  | 'login'
  | 'register'
  | 'products'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'profile'
  | 'admin-dashboard'
  | 'admin-products'
  | 'admin-orders'
  | 'admin-discounts'
  | 'admin-users';
