import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class ShopService {
    private API_URI = `${environment.apiUrl}/shops`;
    private UPLOAD_URI = `${environment.apiUrl}/upload/image`;

    constructor(private http: HttpClient) {}

    getShopById(id: number) {
        return this.http.get<any>(`${this.API_URI}/${id}`);
    }

    getShops() {
        return this.http.get<any[]>(this.API_URI);
    }

    getShopsAvailableForBoutique(editingUserId?: string | null) {
        const params = editingUserId ? { editingUserId } : {};
        return this.http.get<any[]>(`${this.API_URI}/available-for-boutique`, { params });
    }

    createShop(shopData: any) {
        return this.http.post<any>(this.API_URI, shopData);
    }

    deleteShop(id: string) {
        return this.http.delete<any>(`${this.API_URI}/${id}`);
    }

    uploadImage(file: File) {
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post<{ imageUrl: string }>(this.UPLOAD_URI, formData);
    }
}