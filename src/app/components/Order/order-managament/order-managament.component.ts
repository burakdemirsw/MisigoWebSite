import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable } from 'rxjs';
import { PrinterInvoiceRequestModel } from 'src/app/models/model/order/printerInvoiceRequestModel';
import { ProductOfOrder } from 'src/app/models/model/order/productOfOrders';
import { SaleOrderModel } from 'src/app/models/model/order/saleOrderModel';
import { HttpClientService } from 'src/app/services/http-client.service';
import { AlertifyService } from 'src/app/services/ui/alertify.service';

@Component({
  selector: 'app-order-managament',
  templateUrl: './order-managament.component.html',
  styleUrls: ['./order-managament.component.css']
})
export class OrderManagamentComponent implements OnInit {

  numberOfList : number[] = [1,10,20,50,100]
  saleOrderModels : SaleOrderModel[]

  constructor(
    private httpClientService: HttpClientService,
    private alertifyService: AlertifyService,
    private spinnerService: NgxSpinnerService,
    private router : Router

  ) { }

  ngOnInit(): void {
    this.spinnerService.show();
    this.getOrders();
    this.spinnerService.hide();


  }
  productsToCollect: ProductOfOrder[];


  async routeToCPP() {
    let packageNo: string = (document.getElementById('numberOfList') as HTMLInputElement).value;
  
    if (packageNo == null || packageNo == '') {
      alert('Lütfen Bir Müktar Seçiniz');
    } else {
      try {
        // Wait for the products to be fetched before navigating
        await this.httpClientService.get<ProductOfOrder>({
          controller: 'Order/GetProductsOfOrders/' + packageNo.toString(),
        }).subscribe((data) => {
          this.productsToCollect = data;
  
          // After the data is fetched, you can access the first item in the productsToCollect array
          if (this.productsToCollect.length > 0) {
            this.router.navigate(['/collect-product-of-order/' + this.productsToCollect[0].packageNo]);
          } else {
            // Handle the case when no products are returned
            console.log('No products found for the given packageNo');
          }
        });
      } catch (error: any) {
        console.log('Error fetching products:', error.message);
      }
    }
  }
  getOrders(): any {
    try {
      this.httpClientService
        .get<SaleOrderModel>({
          controller: 'Order',
        })
        .subscribe((data) => {
          //console.log(data);
          this.saleOrderModels = data;
        });
    } catch (error: any) {
      console.log(error.message);
    }
  }

  printPicture(url:string){
   var  model : PrinterInvoiceRequestModel = new PrinterInvoiceRequestModel();
   model.printerName = "EPSON-DEPO (L3150 Series)"
   model.url= url;
    try {
      this.httpClientService
        .post<PrinterInvoiceRequestModel>({
          controller: 'Order/TryPrintPicture',  
        },model)
        .subscribe((data) => {
          console.log(data);
          // this.saleOrderModels = data;
        });
    } catch (error: any) {
      console.log(error.message);
    }
    }
  }



