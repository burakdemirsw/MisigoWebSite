import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LogFilterModel } from 'src/app/models/model/log/logFilterModel ';
import { HttpClientService } from '../http-client.service';
import { ToasterService } from '../ui/toaster.service';
import { CreatePackage_MNG_Request, CreateBarcode_MNG_Request } from 'src/app/components/cargo/create-cargo/models/models';

@Injectable({
  providedIn: 'root'
})
export class CargoService {

  constructor(
    private toasterService: ToasterService,
    private httpClientService: HttpClientService,
    private router: Router,
    private httpClient: HttpClient
  ) { }

  async createCargo(request: CreatePackage_MNG_Request): Promise<any> {
    try {
      var response = await this.httpClientService.post<any>({ controller: "cargos/create-cargo" }, request).toPromise();

      return response;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }

  async printBarcode(request: CreateBarcode_MNG_Request): Promise<any> {
    try {
      var response = await this.httpClientService.post<any>({ controller: "cargos/print-barcode" }, request).toPromise();

      return response;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }


  async printSingleBarcode(request: string): Promise<any> {
    try {
      var response = await this.httpClientService.get<any>({ controller: "cargos/print-single-barcode" }, request).toPromise();

      return response;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }


  async getShippedCargos(): Promise<any> {
    try {
      var response = await this.httpClientService.get<any>({ controller: "cargos/get-shipped-cargos" }).toPromise();

      return response;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }

  async getPackageStatus(shipmentId: string): Promise<any> {
    try {
      var response = await this.httpClientService.get<any>({ controller: "cargos/get-package-status" }, shipmentId).toPromise();

      return response;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }


}
