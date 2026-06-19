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
    netValue?: number | "";
    description: string;
    withdrawalNote?: string;
    product: Product;
    arrivalDate:string;
    outDate:string | "";
    barcode:string;
    images?: InventoryFile[];
    imageCodes?: string[];
};