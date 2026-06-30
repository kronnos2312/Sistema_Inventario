import { Category } from './Category';

export type ProductGroup = {
  id: number | null;
  name: string;
  description: string;
  categories: Category[];
};
