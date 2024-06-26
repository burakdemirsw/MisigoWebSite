import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerModel } from 'src/app/models/model/customer/customerModel';
import { CountListFilterModel } from 'src/app/models/model/filter/countListFilterModel';
import { InvocieFilterModel } from 'src/app/models/model/filter/invoiceFilterModel';
import { WarehouseOperationListFilterModel } from 'src/app/models/model/filter/warehouseOperationListFilterModel';
import { WarehouseTransferListFilterModel } from 'src/app/models/model/filter/warehouseTransferListFilterModel';
import { CountProductRequestModel2, CountProductRequestModel3 } from 'src/app/models/model/order/countProductRequestModel2';
import { CountListModel } from 'src/app/models/model/product/countListModel';
import { CountedProduct, CountedProductControl } from 'src/app/models/model/product/countedProduct';
import {
  ProductCountModel
} from 'src/app/models/model/shelfNameModel';
import { AvailableShelf } from 'src/app/models/model/warehouse/availableShelf';
import { FastTransferListModel, FastTransferModel, FastTransferModel2 } from 'src/app/models/model/warehouse/fastTransferModel';
import { OfficeModel } from 'src/app/models/model/warehouse/officeModel';
import { TransferModel } from 'src/app/models/model/warehouse/transferModel';
import { TransferRequestListModel } from 'src/app/models/model/warehouse/transferRequestListModel';
import { WarehouseOperationListModel } from 'src/app/models/model/warehouse/warehosueOperationListModel';
import { WarehouseOfficeModel } from 'src/app/models/model/warehouse/warehouseOfficeModel';
import { WarehouseOperationProductModel } from 'src/app/models/model/warehouse/warehouseOperationProductModel';
import { HttpClientService } from '../http-client.service';
import { ToasterService } from '../ui/toaster.service';
import { GeneralService } from './general.service';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  constructor(
    private toasterService: ToasterService,
    private httpClientService: HttpClientService,
    private router: Router,
    private generalService: GeneralService
  ) { }

  //ürün sayım 1
  async countProductRequest(
    barcode: string,
    shelfNo: string,
    qty: number,
    office: string,
    warehouseCode: string,
    batchCode: string,

    url: string,
    orderNo: string,
    currAccCode: string
  ): Promise<ProductCountModel> {
    if (barcode.includes('/')) {
      barcode = barcode.replace(/\//g, '-');
    }

    var requestModel: CountProductRequestModel2 =
      new CountProductRequestModel2();
    requestModel.barcode = barcode;
    requestModel.shelfNo = shelfNo;
    requestModel.batchCode = batchCode;
    requestModel.office = office;
    requestModel.warehouseCode = warehouseCode;
    requestModel.quantity = qty.toString() == '' ? 1 : qty;
    requestModel.currAccCode = currAccCode;
    requestModel.isReturn = false;
    requestModel.salesPersonCode = '';
    requestModel.taxTypeCode = '';
    requestModel.orderNo = orderNo;
    var response = await this.httpClientService
      .post<ProductCountModel | any>(
        {
          controller: url,
        },
        requestModel
      )
      .toPromise();

    return response;
  }
  async countProductRequest2(
    barcode: string,
    shelfNo: string,
    qty: number,
    office: string,
    warehouseCode: string,
    batchCode: string,

    url: string,
    orderNo: string,
    currAccCode: string,
    lineId: string
  ): Promise<ProductCountModel> {
    if (barcode.includes('/')) {
      barcode = barcode.replace(/\//g, '-');
    }

    var requestModel: CountProductRequestModel3 =
      new CountProductRequestModel3();
    requestModel.barcode = barcode;
    requestModel.shelfNo = shelfNo;
    requestModel.batchCode = batchCode;
    requestModel.office = office;
    requestModel.warehouseCode = warehouseCode;
    requestModel.quantity = qty.toString() == '' ? 1 : qty;
    requestModel.currAccCode = currAccCode;
    requestModel.isReturn = false;
    requestModel.salesPersonCode = '';
    requestModel.taxTypeCode = '';
    requestModel.orderNo = orderNo;
    requestModel.lineId = lineId;
    var response = await this.httpClientService
      .post<ProductCountModel | any>(
        {
          controller: url,
        },
        requestModel
      )
      .toPromise();

    return response;
  }
  //ofisleri çeker
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

  //depo listesini çeker
  async getWarehouseList(value: string): Promise<WarehouseOfficeModel[]> {
    try {
      const selectElement = document.getElementById(
        'officeCode'
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

  //müşteri listesini çeker
  async getCustomerList(customerType: string): Promise<CustomerModel[]> {
    try {
      const data = await this.httpClientService
        .get<CustomerModel>({
          controller: 'Order/CustomerList/' + customerType,
        })
        .toPromise();

      return data;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }

  //sayım listesini çeker
  async getCountList(): Promise<CountListModel[]> {
    const data = await this.httpClientService
      .get<CountListModel>({ controller: 'Order/GetCountList' })
      .toPromise();
    return data;
  }


  //sayım ürünklerini çeker 100 adet
  async getProductOfCount(orderNo: string): Promise<CountedProduct[]> {
    const data = await this.httpClientService
      .get<CountedProduct>({ controller: 'Order/GetProductOfCount/' + orderNo })
      .toPromise();
    return data;
  }
  //sayım ürünklerini kontrol eder
  async getProductOfCountControl(orderNo: string): Promise<CountedProductControl[]> {
    const data = await this.httpClientService
      .get<CountedProductControl>({ controller: 'Order/get-product-of-count-control/' + orderNo })
      .toPromise();
    return data;
  }

  //depolar arası transferin taplann ürünlerini çeker
  async getProductOfTrasfer(orderNo: string): Promise<TransferModel[]> {
    const data = await this.httpClientService
      .get<TransferModel>({
        controller: 'Order/GetProductOfTrasfer/' + orderNo,
      })
      .toPromise();
    return data;
  }

  //sayım ürünklerini filtreli Çeker
  async GetCountListByFilter(model: CountListFilterModel): Promise<any> {
    const data = await this.httpClientService
      .post<CountListFilterModel>(
        { controller: 'Order/GetCountListByFilter/' },
        model
      )
      .toPromise();
    return data;
  }

  //hızlı transfer ekleme
  async fastTransfer(model: FastTransferModel): Promise<any> {
    const data = await this.httpClientService
      .post<FastTransferModel>({ controller: 'Order/FastTransfer' }, model) //Usp_PostZtMSRAFSTOKTransfer
      .toPromise();
    return data;
  }

  //hızlı transferin ürünlerini çeker
  async getGetAllFastTransferModelById(
    operationId: string
  ): Promise<FastTransferModel[]> {
    const data = await this.httpClientService
      .get<FastTransferModel>({
        controller: 'Order/GetFastTransferModel/' + operationId,
      })
      .toPromise();
    return data;
  }

  //transfer işlemlerini çeker
  async getWarehouseOperations(status: string): Promise<any> {

    const data = this.httpClientService
      .get<WarehouseOperationListModel>({
        controller: 'Warehouse/GetWarehosueOperationList',
      }, status)
      .toPromise();

    return data;

  }

  async getWarehosueOperationListByInnerNumber(
    innerNumber: string
  ): Promise<any> {

    const data = this.httpClientService
      .get<WarehouseOperationListModel>(
        {
          controller: 'Warehouse/getWarehosueOperationListByInnerNumber',
        },
        innerNumber
      )
      .toPromise();

    return data;

  }

  //transfer operasyonlarını nebimden filtreleyerek çeker
  async getWarehosueOperationListByFilter(
    model: WarehouseOperationListFilterModel
  ): Promise<any> {

    const data = this.httpClientService
      .post<WarehouseOperationListModel>(
        {
          controller: 'Warehouse/GetWarehosueOperationListByFilter',
        },
        model
      )
      .toPromise();

    return data;

  }

  //transfer işlemlerini filtreleyerek çeker
  async getWarehosueTransferListByFilter(
    model: WarehouseTransferListFilterModel
  ): Promise<any> {

    const data = this.httpClientService
      .post<WarehouseTransferListFilterModel>(
        {
          controller: 'Warehouse/GetWarehosueTransferList',
        },
        model
      )
      .toPromise();

    return data;

  }

  //transfer işlemi
  async transfer(model: WarehouseOperationProductModel): Promise<any> {

    const result = await this.httpClientService
      .post<WarehouseOperationProductModel>(
        {
          controller: 'Warehouse/Transfer',
        },
        model
      )
      .toPromise();

    return result;

  }
  //deleteCountById
  async deleteTransferFromId(id: string): Promise<any> {

    const result = await this.httpClientService
      .get<any>({
        controller: 'Warehouse/DeleteWarehouseTransferById/' + id,
      })
      .toPromise();

    return result;

  }

  async deleteCountFromId(id: string): Promise<any> {
    try {
      const result = await this.httpClientService
        .get<any>({
          controller: 'Warehouse/DeleteCountById/' + id,
        })
        .toPromise();

      return result;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }
  async getTransferRequestListModel(type: string): Promise<TransferRequestListModel[]> {

    const response = await this.httpClientService
      .get<TransferRequestListModel>({
        controller: 'Warehouse/TransferRequestList'
      }, type)
      .toPromise();
    return response;

  }

  //sayılabilecek rafları çeker
  // Get_MSRAFWillBeCounted
  async getAvailableShelves(): Promise<AvailableShelf[]> {

    const data = await this.httpClientService
      .get<AvailableShelf>({ controller: 'Order/GetAvailableShelves' })
      .toPromise();
    return data;

  }


  //raflar arası transfer ----------------------------------------------------
  async addFastTransferModel(request: FastTransferModel2): Promise<boolean> {

    const response = await this.httpClientService
      .post<any>({ controller: 'Warehouse/add-fast-transfer-model' }, request)
      .toPromise();
    return response;

  }

  async deleteFastTransferModel(request: string): Promise<any> {

    const response = await this.httpClientService
      .get<any>({ controller: 'Warehouse/delete-fast-transfer-model' }, request)
      .toPromise();
    return response;

  }

  async getFastTransferModels(request: string): Promise<any> {

    const response = await this.httpClientService
      .get<any>({ controller: 'Warehouse/get-fast-transfer-models' }, request)
      .toPromise();
    return response;

  }

  // Get fast transfer list models
  async getFastTransferListModels(): Promise<FastTransferListModel[]> {
    const response = await this.httpClientService
      .get<FastTransferListModel>({
        controller: 'Warehouse/get-fast-transfer-list',
      })
      .toPromise();
    return response;
  }
  //---------------------------------------------------------------------------
}
