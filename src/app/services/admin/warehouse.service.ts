import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClientService } from '../http-client.service';
import { AlertifyService } from '../ui/alertify.service';
import { CountProductRequestModel2 } from 'src/app/models/model/order/countProductRequestModel2';
import { ProductCountModel } from 'src/app/models/model/shelfNameModel';
import { CustomerModel } from 'src/app/models/model/customer/customerModel';
import { OfficeModel } from 'src/app/models/model/warehouse/officeModel';
import { WarehouseOfficeModel } from 'src/app/models/model/warehouse/warehouseOfficeModel';

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {

  constructor(
    private alertifyService: AlertifyService,
    private httpClientService: HttpClientService,
    private router: Router
  ) { }

  //ürün sayım 1
  async countProductRequest(
    barcode: string,
    shelfNo: string,
    qty: number,
    office: string,
    warehouseCode: string,
    batchCode: string,

    url: string
  ): Promise<ProductCountModel> {
    var requestModel: CountProductRequestModel2 =
      new CountProductRequestModel2();
    requestModel.barcode = barcode;
    requestModel.shelfNo = shelfNo;
    requestModel.qty = qty.toString() == '' ? 1 : qty;
    requestModel.office = office;
    requestModel.warehouseCode = warehouseCode;
    requestModel.batchCode = batchCode;

    var response = await this.httpClientService
      .post<ProductCountModel | any>({
        controller: url 
      }, requestModel)
      .toPromise();

    return response;
  }
  async getOfficeCodeList(): Promise<OfficeModel[]> {
    try {
      const data = await this.httpClientService
        .get<OfficeModel>({
          controller: 'Warehouse/GetOfficeModel',
        })
        .toPromise();
  
      return data;
    } catch (error: any) {
      console.log(error.message);
      return null;
      
    }
  }
  
  async getWarehouseList(value: string): Promise<WarehouseOfficeModel[]> {
    try {
      const selectElement = document.getElementById(
        'office'
      ) as HTMLSelectElement;
  
      value = selectElement.value == '' ? 'M' : selectElement.value;
  
      const data = await this.httpClientService
        .get<WarehouseOfficeModel>({
          controller: 'Warehouse/GetWarehouseModel/' + value,
        })
        .toPromise();
        return data;

     
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }
  
  async getCustomerList(): Promise<CustomerModel[]> {
    try {
      const data = await this.httpClientService
        .get<CustomerModel>({
          controller: 'Order/CustomerList/1',
        })
        .toPromise();
  
      
        return data;
    
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }
}