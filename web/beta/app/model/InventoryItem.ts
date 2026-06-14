import { Product } from "./Product";

export type InventoryItem = {
    id: number| "";
    quantity: number | "";
    price: number | "";
    description: string;
    withdrawalNote?: string;
    product: Product;
    arrivalDate:string;
    outDate:string | "";
    barcode:string;
};