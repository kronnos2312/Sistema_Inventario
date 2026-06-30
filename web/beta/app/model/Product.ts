import { Category } from './Category';

export type Product = {
  id: number | "";
  name: string;
  brand: string;
  model: string;
  category: Category | null;
};
