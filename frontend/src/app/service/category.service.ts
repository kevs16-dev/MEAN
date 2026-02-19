import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class CategoryService {
    private API_URI = `${environment.apiUrl}/categories`;

    constructor(private http: HttpClient) {}

    getCategories() {
        return this.http.get<any[]>(this.API_URI);
    }

    createCategory(categoryData: any) {
        return this.http.post<any>(this.API_URI, categoryData);
    }
}