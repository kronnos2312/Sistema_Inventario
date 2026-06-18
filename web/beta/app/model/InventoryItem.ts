import { Product } from "./Product";

export type InventoryFile = {
    id?: number;
    code: string;
    url: string;
};

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
    images?: InventoryFile[];
    imageCodes?: string[];
};