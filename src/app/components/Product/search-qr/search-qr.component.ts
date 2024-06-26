import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Exception } from '@zxing/library';
import { CreatePurchaseInvoice } from 'src/app/models/model/invoice/createPurchaseInvoice';
import { ProductList_VM } from 'src/app/models/model/product/productList_VM';
import { QrCode } from 'src/app/models/model/product/qrCode';
import { GeneralService } from 'src/app/services/admin/general.service';
import { HeaderService } from 'src/app/services/admin/header.service';
import { BarcodeSearch_RM, ProductService } from 'src/app/services/admin/product.service';
import { HttpClientService } from 'src/app/services/http-client.service';
import { ToasterService } from 'src/app/services/ui/toaster.service';
declare var window: any;
@Component({
  selector: 'app-search-qr',
  templateUrl: './search-qr.component.html',
  styleUrls: ['./search-qr.component.css']
})
export class SearchQrComponent implements OnInit {

  qrCodes: QrCode[] = [];
  showImage = false; // add this property
  view = true;
  constructor(
    private toasterService: ToasterService,

    private productService: ProductService,
    private formBuilder: FormBuilder, private sanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private httpClientService: HttpClientService,
    private headerService: HeaderService,
    private generalService: GeneralService
  ) { }
  currentId: string = null
  qrForm: FormGroup;
  async ngOnInit() {
    this.headerService.updatePageTitle("Ürün & Qr Sorgulama")
    this.activatedRoute.params.subscribe(async (params) => {
      this.currentId = params['id']
      if (this.currentId != null) {
        await this.getProducts(this.currentId);
      }
      // this.toasterService.success(this.currentId)
    })
    //this.spinnerService.show();

    this.formGenerator();

    //this.spinnerService.hide();
  }
  qrCodeValue: string;

  invoiceProducts2: CreatePurchaseInvoice[] = [];
  createJson(barcode: string, shelfNo: string) {

    var model: QrCode = this.qrCodes.find(
      (p) => (p.barcode = barcode) && p.shelfNo == shelfNo
    );
    const formDataJSON = JSON.stringify(model.barcode + "--" + model.batchCode + "--" + model.itemCode); // Form verilerini JSON'a dönüştür

    this.qrCodeValue = formDataJSON;
    // this.toasterService.success(this.qrCodeValue)

  }
  modalImageUrl: string;
  formModal: any;
  openImageModal(imageUrl: string) {
    this.modalImageUrl = imageUrl;
    if (!this.formModal) {
      this.formModal = new window.bootstrap.Modal(
        document.getElementById('myModal')
      );
    }
    this.formModal.show();
  }


  qrCodeDownloadLink: any = this.sanitizer.bypassSecurityTrustResourceUrl('');
  onChangeURL(url: SafeUrl) {
    this.qrCodeDownloadLink = url;
    this.openImageModal(this.qrCodeDownloadLink);
    this.qrCodeValue = ''
  }

  formGenerator() {
    try {
      this.qrForm = this.formBuilder.group({
        barcode: [null, Validators.required],
      });
    } catch (error: any) {
      this.toasterService.error(error.message);
    }
  }

  selectedProductList: number[] = [];
  visible: boolean = false;
  openShelvesModal(id: any) {
    this.visible = true;
  }

  async print(base64Code: string) {
    const confirmDelete2 = window.confirm("Yazıcıdan Yazdırılacaktır. Emin misiniz?");
    if (confirmDelete2) {
      var requestModel = { imageCode: base64Code, printCount: 1 };
      var response = await this.httpClientService.post<any>({ controller: 'Order/Qr' }, requestModel).toPromise();
      // Base64 veriyi konsola bas
      if (response) {
        this.toasterService.success("Yazdırıldı")
      }
      // console.log(imgData.split('base64,')[1]);

    }
  }
  async getProducts(barcode: string) {

    if (this.generalService.isGuid(barcode) || barcode.includes('http')) {
      this._products = []
      if (this.currentId || barcode) {
        const response = await this.productService.getQr(barcode);
        this.qrCodes = response;
        return response;
      } else {
        throw new Exception("id alanı boş")
      }
    } else {
      this.qrCodes = []
      await this.getProducts2(barcode);
    }

  }

  _products: ProductList_VM[] = [];
  async getProducts2(barcode: string) {
    try {

      if (barcode.includes("=")) {
        barcode = barcode.replace(/=/g, "-");

      }
      var model: BarcodeSearch_RM = new BarcodeSearch_RM();
      model.barcode = barcode;
      const response = await this.productService._searchProduct(model);
      this._products = response;
      return response;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }
  clearBarcode() {
    this.qrForm.get('barcode').setValue(null);
    this.focusNextInput('barcode');
  }
  focusNextInput(nextInputId: string) {
    const nextInput = document.getElementById(nextInputId) as HTMLInputElement;
    if (nextInput) {
      nextInput.focus();
    }
  }
  async onSubmit(value: any) {
    await this.getProducts(value.barcode);
    this.toasterService.success(value.barcode);
  }
}
