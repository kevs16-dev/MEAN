import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class ShopService {
    private API_URI = `${environment.apiUrl}/shops`;

    constructor(private http: HttpClient) {}

    getShopById(id: number) {
        return this.http.get<any>(`${this.API_URI}/${id}`);
    }

    getShops() {
        return this.http.get<any[]>(this.API_URI);
    }

    createShop(shopData: any) {
        return this.http.post<any>(this.API_URI, shopData);
    }
}