import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerAddress_VM, CustomerList_VM, GetCustomerList_CM } from '../../../models/model/order/getCustomerList_CM';
import { OrderService } from '../../../services/admin/order.service';
import { GetCustomerAddress_CM } from 'src/app/models/model/order/getCustomerList_CM';
import { BarcodeSearch_RM, ProductService } from 'src/app/services/admin/product.service';
import { ProductList_VM } from 'src/app/models/model/product/productList_VM';
import * as Tesseract from 'tesseract.js';
import { GoogleDriveService } from '../../../services/common/google-drive.service';
import { AddressService } from 'src/app/services/admin/address.service';
import { Address_VM } from 'src/app/models/model/order/ViewModel/provinceVM';
import { AddCustomerAddress_CM, ClientCustomer, CreateCustomer_CM } from './models/createCustomer_CM';
import { ClientOrder, ClientOrderBasketItem, Line, NebimInvoice, NebimOrder, NebimOrder_2, Payment } from './models/nebimOrder';
import { GeneralService } from 'src/app/services/admin/general.service';
import { SalesPersonModel } from 'src/app/models/model/order/salesPersonModel';
import { HttpClientService } from 'src/app/services/http-client.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToasterService } from 'src/app/services/ui/toaster.service';
import { Payment_CM, Payment_CR } from 'src/app/models/model/payment/payment_CR';
import { PaymentService } from 'src/app/services/admin/payment.service';
import { PostalAddress } from 'src/app/models/nebim/customer/nebimCustomer';
import { CreatePackage_MNG_RR, CargoSetting, CreatePackage_MNG_Request, OrderDetail, CreateBarcode_MNG_Request, OrderPieceListMNG, CreatePackage_MNG_RM } from '../../cargo/create-cargo/models/models';
import { CargoService } from 'src/app/services/admin/cargo.service';
import { WarehouseService } from 'src/app/services/admin/warehouse.service';
import { ProductCountModel } from 'src/app/models/model/shelfNameModel';
import { Table } from 'primeng/table';
import { ExchangeRate } from 'src/app/models/model/order/exchangeRate';

@Component({
  selector: 'app-create-order',
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.css']
})
export class CreateOrderComponent implements OnInit {
  [x: string]: any;
  selectedCustomers: CustomerList_VM[] = []
  selectedProducts: ProductList_VM[] = []
  selectedAddresses: CustomerAddress_VM[] = []
  selectedOfficeAndWarehosue: any[] = [];
  currAccCode: string;
  salesPersonCode: string;
  payment: Payment = new Payment();
  activeIndex = 0;
  @ViewChild('findCustomer', { static: false }) findCustomer: ElementRef;
  @ViewChild('findAddress', { static: false }) findAddress: ElementRef;
  @ViewChild('findProducts', { static: false }) findProducts: ElementRef;
  @ViewChild('preview', { static: false }) preview: ElementRef;

  true: boolean = true;
  orderNo: string;
  id: string;
  orderType: boolean;
  pageTitle: string;
  exchangeRate: ExchangeRate;
  constructor(private warehouseService: WarehouseService, private paymentService: PaymentService, private toasterService: ToasterService, private activatedRoute: ActivatedRoute,
    private router: Router, private httpClientService: HttpClientService,
    private generalService: GeneralService, private addressService: AddressService,
    private googleDriveService: GoogleDriveService, private productService: ProductService,
    private formBuilder: FormBuilder, private orderService: OrderService,
    private cargoService: CargoService) { }

  async ngOnInit() {

    this.exchangeRate = await this.orderService.getExchangeRates();
    this.generatedCargoNumber = this._generateRandomNumber();
    this.createDiscountForm();
    this.createGetCustomerForm();
    this.createCustomerFormMethod();
    this.createGetProductForm();
    this.createOfficeWarehouseForm();
    this._createCustomerFormMethod();
    this.getAddresses();
    this.selectOfficeAndWarehosue();

    this.createCargoForm();

    this.activatedRoute.params.subscribe(async (params) => {
      if (params['id']) {
        this.id = params['id']
        this.getClientOrder(0);
        if (params['orderType'] === 'quick-order') {
          this.orderType = true;
          this.pageTitle = "Sipariş Ver"
        } else {

          this.pageTitle = "Perakende Satış"
          this.orderType = false;
        }

        //   this.toasterService.warn(this.orderType.toString())
      }
    })
    var spc = localStorage.getItem('salesPersonCode');
    if (!spc) {
      this.router.navigate(["/pages-loginv2"])
    } else {
      this.salesPersonCode = spc;
    }

  }

  //--------------------------------------------------------------------------- CLIENT ORDER
  stateOptions: any[] = [{ label: 'Standart', value: '0' }, { label: 'Vergisiz', value: '4' }];
  taxTypeCode: any;
  isCompleted: boolean = false;
  orderNumber: string = "";
  async getClientOrder(state: number) {
    var response = await this.orderService.getClientOrder(this.id);

    if (state === 0) {
      if (response.clientOrder) {
        var order = response;
        this.isCompleted = order.clientOrder.isCompleted
        this.currAccCode = order.clientOrder.customerCode;
        this.orderNumber = order.clientOrder.orderNumber
        var customer_request = new GetCustomerList_CM();
        customer_request.currAccCode = this.currAccCode;
        if (customer_request.currAccCode != null) {
          var customerResponse = await await this.orderService.getCustomerList_2(customer_request)
          if (customerResponse) {
            this.selectedCustomers.push(customerResponse[0]);

          }
        } else {
          this.toasterService.error("Eklenecek Müşteri Bulunamadı")

        }

        var request_address = new GetCustomerAddress_CM();
        request_address.currAccCode = this.currAccCode;
        var response = await this.orderService.getCustomerAddress(request_address)
        if (response) {
          var findedAddress = response.find((x: { postalAddressID: any; }) => x.postalAddressID === order.clientOrder.shippingPostalAddressId);
          if (findedAddress) {
            this.selectedAddresses.push(findedAddress);
            // this.toasterService.success("Adres Eklendi")
          } else {
            //this.toasterService.error("Eklenecek Adres Bulunamadı")
          }

        }
        if (order.clientOrder.paymentDescription) {
          this.payment = new Payment();
          this.payment.currencyCode = "TRY";
          this.payment.code = "";
          this.payment.installmentCount = 0;
          this.payment.paymentType = "2";
          this.payment.creditCardTypeCode = order.clientOrder.paymentDescription;
          this.toasterService.success("Ödeme Eklendi")
        }

        this.payment.amount = this.selectedProducts.reduce((total, product) => total + product.price, 0);
        // this.selectedAddresses = []; burası
        this.orderNo = order.clientOrder.orderNo;

        if (order.clientOrderBasketItems.length > 0) {
          this.selectedProducts = [];
          order.clientOrderBasketItems.reverse();
          order.clientOrderBasketItems.forEach((basketItem: ClientOrderBasketItem) => {
            var object = this.convertLineToObject(basketItem);
            this.selectedProducts.push(object);
          });
        }

        //this.toasterService.success("Sipariş Çekildi")

      } else {
        this.orderNo = this.generateRandomNumber();
        this.toasterService.success("Yeni Sipariş : " + this.orderNo)
      }
    } else {
      if (response.clientOrder) {
        var order = response;
        this.selectedProducts = [];
        if (order.clientOrderBasketItems.length > 0) {

          order.clientOrderBasketItems.forEach((basketItem: ClientOrderBasketItem) => {
            var object = this.convertLineToObject(basketItem);
            this.selectedProducts.push(object);
          });
        }

        //this.toasterService.success("Ürünler Çekildi")

      } else {
        this.toasterService.error("Yanıt Yok")
      }
    }

  }
  async deleteClientOrder() {
    var response = await this.orderService.deleteClientOrder(this.id);
    if (response) {
      this.toasterService.success("Sipariş Silindi");
      this.createNewOrder();
    }
  }
  convertLineToObject(line: ClientOrderBasketItem): ProductList_VM {
    var object = new ProductList_VM();
    object.lineId = line.lineId;
    object.description = line.description;
    object.photoUrl = line.photoUrl;
    object.shelfNo = line.shelfNo;
    object.barcode = line.barcode;
    object.itemCode = line.itemCode;
    object.batchCode = line.batchCode;
    object.price = line.price;
    object.quantity = line.quantity;
    object.warehouseCode = line.warehouseCode;
    object.brandDescription = line.brandDescription;
    object.uD_Stock = line.uD_Stock;
    object.mD_Stock = line.mD_Stock;
    object.basePrice = line.basePrice;
    object.discountedPrice = line.discountedPrice;
    return object;
  }
  createClientOrder_RM(): ClientOrder {
    try {

      var request: ClientOrder = new ClientOrder()
      request.customerCode = this.currAccCode
      request.id = this.id;
      request.orderNo = this.orderNo;
      request.customerDescription = this.selectedCustomers[0]?.currAccDescription || null;
      request.shippingPostalAddressId = this.selectedAddresses[0]?.postalAddressID;
      if (this.payment) {
        request.paymentType = this.payment.creditCardTypeCode;
      } else {
        request.paymentType = null;
      }

      request.createdDate = new Date();

      return request;
    } catch (error) {
      this.toasterService.error(error.message)
      return null;
    }

  }
  createClientOrderBasketItem_RM(line: ProductList_VM): ClientOrderBasketItem {
    try {
      var newLine = Object.assign({}, line);
      newLine.quantity = 1;
      var request: ClientOrderBasketItem = new ClientOrderBasketItem()

      request.orderId = this.id;
      request.createdDate = new Date();

      request.lineId = newLine.lineId;
      request.description = newLine.description;
      request.photoUrl = newLine.photoUrl;
      request.shelfNo = newLine.shelfNo;
      request.barcode = newLine.barcode;
      request.itemCode = newLine.itemCode;
      request.batchCode = newLine.batchCode;
      request.price = newLine.price;
      request.quantity = newLine.quantity;
      request.warehouseCode = newLine.warehouseCode;
      request.brandDescription = newLine.brandDescription;
      request.uD_Stock = newLine.uD_Stock;
      request.mD_Stock = newLine.mD_Stock;
      request.basePrice = newLine.basePrice;
      request.discountedPrice = newLine.discountedPrice;
      return request;
    } catch (error) {
      this.toasterService.error(error.message)
      return null;
    }

  }

  //---------------------------------------------------------------------------
  //--------------------------------------------------------------------------- SATIŞ ELEMANI
  salesPersonModels: SalesPersonModel[] = [];
  salesPersonModelList: any[] = [];
  selectedPerson: any;
  selectSalesPerson() {
    this.activeIndex = 1;
    this.generalService.beep();
    this.toasterService.success("Satış Elemanı Seçildi")
  }
  async getSalesPersonModels(): Promise<any> {
    try {
      try {
        this.salesPersonModels = await this.httpClientService
          .get<SalesPersonModel>({
            controller: 'Order/GetSalesPersonModels',
          })
          .toPromise();

        this.salesPersonModels.forEach((c) => {
          var color: any = { name: c.firstLastName + " " + `${c.salespersonCode}`, code: c.salespersonCode };
          this.salesPersonModelList.push(color);
        });

        //this.toasterService.success("Başarıyla "+this.salesPersonModels.length+" Adet Çekildi")
      } catch (error: any) {
        this.toasterService.error(error.message);
        return null;
      }
    } catch (error: any) {
      this.toasterService.error(error.message);
    }
  }
  //---------------------------------------------------------------------------
  //---------------------------------------------------------------------------ADRES
  addressForm: FormGroup
  countries: Address_VM[] = []
  provinces: Address_VM[] = []
  districts: Address_VM[] = []
  regions: Address_VM[] = []
  taxOffices: Address_VM[] = []
  updated_districts: Address_VM[] = []
  _regions: any[] = []
  _taxOffices: any = []
  _countries: any[] = []
  _provinces: any[] = []
  _districts: any[] = []
  _neighborhoods: any[] = []



  _createCustomerForm: FormGroup;
  async _submitAddressForm(values: any) {
    var postalAddress: PostalAddress = new PostalAddress();
    postalAddress.countryCode = values.address_country.code;
    postalAddress.stateCode = values.address_region.code;
    postalAddress.cityCode = values.address_province.code;
    postalAddress.districtCode = values.address_district.code;
    postalAddress.address = values.address_description;
    postalAddress.addressTypeCode = "1";
    var request: AddCustomerAddress_CM = new AddCustomerAddress_CM(this.selectedCustomers[0].currAccCode, postalAddress);
    var response = await this.orderService.addCustomerAddress(request)
    if (response) {
      var _request: GetCustomerAddress_CM = new GetCustomerAddress_CM();
      this.toasterService.success(response.currAccCode);
      this.getCustomerAddresses(_request);
    }

  }


  //-------------------------------ADRES EKLEME
  _createCustomerFormMethod() {
    this._createCustomerForm = this.formBuilder.group({
      address_country: [null],
      address_province: [null],
      address_district: [null],
      address_region: [null],
      address_description: [null],


    });

    this._createCustomerForm.get('address_region').valueChanges.subscribe(async (value) => { //illeri getir
      var _value = this._createCustomerForm.get('address_region').value;
      var response = await this.addressService.getAddress(3, _value.code)
      this.provinces = response

      this._provinces = [];
      this.provinces.forEach((b) => {
        var provinces: any = { name: b.description, code: b.code };
        this._provinces.push(provinces);
      });
    });

    this._createCustomerForm.get('address_province').valueChanges.subscribe(async (value) => { //ilçeleri getir
      var _value = this._createCustomerForm.get('address_province').value;

      var response = await this.addressService.getAddress(4, _value.code)
      this.districts = response

      this._districts = [];
      this.districts.forEach((b) => {
        var district: any = { name: b.description, code: b.code };
        this._districts.push(district);
      });


      var _value = this._createCustomerForm.get('address_province').value;

      var response = await this.addressService.getAddress(5, _value.code)
      this.taxOffices = response

      this._taxOffices = [];
      this.taxOffices.forEach((b) => {
        var taxOffice: any = { name: b.description, code: b.code };
        this._taxOffices.push(taxOffice);
      });


    });

  }
  //-------------------------------

  async getAddresses() {
    var countries = await this.addressService.getAddress(1)
    this.countries = countries;

    this.countries.forEach((b) => {
      var country: any = { name: b.description, code: b.code };
      this._countries.push(country);
    });

    var regions = await this.addressService.getAddress(2, "TR");
    this.regions = regions;

    this.regions.forEach((b) => {
      var region: any = { name: b.description, code: b.code };
      this._regions.push(region);
    });

    //console.log(countries);
    //console.log(provinces);
  }


  //-------------------------------------------------------------------------
  //------------------------------------------------------------------------- UPLOAD
  selectedFiles: File[] = [];

  async onUpload(event: any, to: string) {
    this.selectedFiles = []; // Her seferinde diziyi sıfırla
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const selectedFile: File = files[i];
      this.selectedFiles.push(selectedFile);
      this.toasterService.success("İşlem Başarılı");
      await this.addPicture(selectedFile, to);
    }
    event.target.value = ""; // Dosyaları sıfırlamak için value değerini sıfırla
  }

  async addPicture(file: File, to: string) {
    var response = await this.googleDriveService.addPicture(file);

    if (to === "bussinesCardPhotoUrl") {

      this.createCustomerForm.get("bussinesCardPhotoUrl").setValue(response.url);

    } if (to === "stampPhotoUrl") {

      this.createCustomerForm.get("stampPhotoUrl").setValue(response.url);

    }

  }

  //-------------------------------------------------------------------------

  //----------------------------------------------------OFİS DEPO

  officeWarehouseForm: FormGroup;
  offices: any[] | undefined = [
    { name: 'Ofis', code: '' },
    { name: 'M', code: 'M' },
    { name: 'U', code: 'U' }
  ];
  warehouses: any[] | undefined = [
    { name: 'Depo', code: '' },
    { name: 'Gerçek Depo', code: 'MD' },
    { name: 'Halkalı Depo', code: 'UD' }
  ];
  createOfficeWarehouseForm() {


  }
  selectOfficeAndWarehosue() {

    this.selectedOfficeAndWarehosue = [
      { office: "M", warehouse: "MD" }
    ];

  }
  //----------------------------------------------------
  //---------------------------------------------------- TEXT OKUMA
  extractedText: string = null;
  imageData: string | ArrayBuffer | null = null;


  onFileSelected(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imageData = e.target?.result;
    };
    reader.readAsDataURL(file);
  }

  extractText() {
    if (this.imageData) {
      this.extractTextFromImage(this.imageData.toString())
        .then(text => {
          this.extractedText = text;
        })
        .catch(error => {
          console.error('Error extracting text:', error);
        });
    }
  }


  extractTextFromImage(imageData: string): Promise<string> {
    return Tesseract.recognize(
      imageData,
      'eng', // English language
      { logger: m => console.log(m) } // Optional logger
    ).then(({ data: { text } }) => {
      return text;
    });
  }

  //----------------------------------------------------
  //----------------------------------------------------

  scrollToPreview(state: number) {
    if (state === 0) {
      if (this.findCustomer) {
        this.findCustomer.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (state === 1) {
      if (this.findAddress) {
        this.findAddress.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (state === 2) {
      if (this.findProducts) {
        this.findProducts.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (state === 3) {
      if (this.preview) {
        this.preview.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }

  }
  //----------------------------------------------------
  //---------------------------------------------------- Dialog değişkenleri ve metodları
  getCustomerDialog: boolean = false;
  findProductDialog: boolean = false;
  selectAddressDialog: boolean = false;
  openDialog(dialogName: string) {
    if (dialogName === "getCustomerDialog") {
      this.getCustomerDialog = !this.getCustomerDialog
    }
    if (dialogName === "findProductDialog") {
      this.findProductDialog = !this.findProductDialog
    }
  }
  goToPage(index: number) {
    this.activeIndex = index;
    // this.toasterService.info(this.activeIndex.toString())
  }
  //----------------------------------------------------

  //---------------------------------------------------- CUSTOMER
  getCustomerForm: FormGroup;
  customers: CustomerList_VM[] = []
  createCustomerForm: FormGroup;
  _activeIndex = 0;
  async submitAddressForm(formValue: any) {
    if (this.createCustomerForm.valid) {
      var request: CreateCustomer_CM = new CreateCustomer_CM();
      request.currAccDescription = formValue.currAccDescription; //++
      request.mail = formValue.mail;
      request.phoneNumber = formValue.phoneNumber;
      request.firmDescription = formValue.firmDescription;
      request.stampPhotoUrl = formValue.stampPhotoUrl;
      request.bussinesCardPhotoUrl = formValue.bussinesCardPhotoUrl;
      request.officeCode = 'M'
      request.warehouseCode = 'MD'

      if (!formValue.address_country) {
        request.address = null
      } else {
        request.address.country = formValue.address_country;
        request.address.province = formValue.address_province;
        request.address.district = formValue.address_district;
        request.address.region = formValue.address_region;
        request.address.taxOffice = formValue.address_taxOffice;
        request.address.description = formValue.address_description;
        request.address.postalCode = formValue.address_postalCode;
      }


      console.log(request)

      if (true) {
        var response = await this.orderService.createCustomer(request);
        if (response.currAccCode) {
          var clientCustomer_request = new ClientCustomer();
          clientCustomer_request.currAccCode = response.currAccCode;
          clientCustomer_request.description = formValue.currAccDescription
          clientCustomer_request.stampPhotoUrl = formValue.stampPhotoUrl;
          clientCustomer_request.bussinesCardPhotoUrl = formValue.bussinesCardPhotoUrl;
          clientCustomer_request.addedSellerCode = localStorage.getItem('salesPersonCode');
          var clientCustomer_response = await this.orderService.editClientCustomer(clientCustomer_request)
          if (clientCustomer_response) {
            this.toasterService.success(this.currAccCode);
            this.currAccCode = response.currAccCode;
            this.getCustomerDialog = true;
            this.getCustomerForm.get("currAccCode").setValue(this.currAccCode);
            await this.getCustomers(this.getCustomerForm.value);
            if (this.customers.length > 0) {
              await this.selectCurrentCustomer(this.customers[0])
              // await this.getCustomerAddresses(this.customers[0]);
            }
            this.activeIndex = 2;
          }

        }
      }
    } else {
      this.generalService.whichRowIsInvalid(this.createCustomerForm)
    }

  }

  createCustomerFormMethod() {
    this.createCustomerForm = this.formBuilder.group({

      office: [null],
      warehouse: [null],
      salesPersonCode: [null],
      currAccDescription: [null, Validators.required],
      mail: [' ', Validators.required],
      phoneNumber: [null, Validators.required],
      stampPhotoUrl: [' ', Validators.required],
      bussinesCardPhotoUrl: [' ', Validators.required],
      address_country: [null],
      address_province: [null],
      address_district: [null],
      address_region: [null],
      taxNumber: [null],
      address_description: [null],
      address_postalCode: [' '],
      address_taxOffice: [null]
    });

    this.createCustomerForm.get('address_region').valueChanges.subscribe(async (value) => { //illeri getir
      var _value = this.createCustomerForm.get('address_region').value;
      var response = await this.addressService.getAddress(3, _value)
      this.provinces = response

      this._provinces = [];
      this.provinces.forEach((b) => {
        var provinces: any = { name: b.description, code: b.code };
        this._provinces.push(provinces);
      });
    });

    this.createCustomerForm.get('address_province').valueChanges.subscribe(async (value) => { //ilçeleri getir
      var _value = this.createCustomerForm.get('address_province').value;

      var response = await this.addressService.getAddress(4, _value)
      this.districts = response

      this._districts = [];
      this.districts.forEach((b) => {
        var district: any = { name: b.description, code: b.code };
        this._districts.push(district);
      });


      var _value = this.createCustomerForm.get('address_province').value;

      var response = await this.addressService.getAddress(5, _value)
      this.taxOffices = response

      this._taxOffices = [];
      this.taxOffices.forEach((b) => {
        var taxOffice: any = { name: b.description, code: b.code };
        this._taxOffices.push(taxOffice);
      });


    });

  }

  createGetCustomerForm() {
    this.getCustomerForm = this.formBuilder.group({
      mail: [null],
      phone: [null],
      currAccCode: [null],
    });
  }
  createCustomerForm_Submit(value: any) {
    if (this.selectCurrentAddress.length > 0) {

    } else {
      this.toasterService.error("Adres Bulunamadı");
    }
    console.log(value)
  }

  async getCustomers(request: GetCustomerList_CM) {
    this.customers = await this.orderService.getCustomerList_2(request)
    console.log(this.customers);
  }
  async selectCurrentCustomer(request: CustomerList_VM) {

    this.selectedCustomers = [];
    this.selectedCustomers.push(request);
    this.currAccCode = request.currAccCode
    this.openDialog("getCustomerDialog");
    this.toasterService.success("Müşteri Seçildi")

    this.generalService.beep();
    var _request: GetCustomerAddress_CM = new GetCustomerAddress_CM();
    _request.currAccCode = request.currAccCode;
    this.getCustomerAddresses(_request);



  }
  deleteCurrentCustomer() {
    this.selectedCustomers = [];
    this.toasterService.success("Müşteri Silindi")
    this.deleteCurrentAddress();
  }
  //----------------------------------------------------ADDRESS
  addresses: CustomerAddress_VM[] = []
  async getCustomerAddresses(request: GetCustomerAddress_CM) {
    this.addresses = await this.orderService.getCustomerAddress(request)
    if (this.addresses.length === 1) {
      this.selectCurrentAddress(this.addresses[0])
      this.selectAddressDialog = false;
      this.activeIndex = 2;
    } else {
      this.selectAddressDialog = true;
    }

    console.log(this.customers);
  }

  async selectCurrentAddress(request: CustomerAddress_VM) {

    this.selectedAddresses = [];
    this.selectedAddresses.push(request);
    var order_request = this.createClientOrder_RM()
    var order_response = await this.orderService.createClientOrder(order_request)
    if (order_response) {

      this.selectAddressDialog = false;
      this.toasterService.success("Adres Eklendi")
      this.activeIndex = 2;
      this.generalService.beep()
    }


  }
  deleteCurrentAddress() {
    this.selectedAddresses = [];
    this.toasterService.success("Adres Silindi")
  }
  //----------------------------------------------------
  //---------------------------------------------------- PRODUCTS

  discountForm: FormGroup;

  createDiscountForm() {

    this.discountForm = this.formBuilder.group({
      cashDiscountRate: [null, Validators.required],
      percentDiscountRate: [null, Validators.required]
    });
  }
  getTotalPrice() {
    return this.selectedProducts.reduce((acc, product) => acc + (product.quantity * product.discountedPrice), 0);
  }


  sizes!: any[];

  selectedSize: any = '';

  percentDiscountRate: number;
  cashDiscountRate: number;

  _discountRate: number;
  getProductsForm: FormGroup;
  products: ProductList_VM[] = [];
  discount(discountRate: number) {

    if (discountRate > 0 && discountRate <= 100) {
      this.selectedProducts.forEach(p => {
        p.discountedPrice = ((100 - discountRate) / 100) * (p.price);
      });
      this._discountRate = discountRate
      this.toasterService.success("İndirim Uygulandı")
    }

  }


  resetDiscount() {

    this.selectedProducts.forEach(p => {
      p.discountedPrice = p.basePrice;
    });
    this.discountForm.reset();
    this.toasterService.success("İndirim Kaldırıldı")

  }
  cashDiscount(discountAmount: number) {

    var value = discountAmount / this.selectedProducts.length
    this.selectedProducts.forEach(p => {
      p.discountedPrice = p.discountedPrice - (value / p.quantity)
    });
    this.toasterService.success("İndirim Uygulandı")


  }
  createGetProductForm() {
    this.getProductsForm = this.formBuilder.group({
      barcode: [null],
      shelfNo: [null]
      // stockCode: [null],
    });
  }

  async getProducts(request: any, pageType: boolean) {


    if (pageType) {
      try {
        var _request = new BarcodeSearch_RM();
        _request.barcode = request.barcode;
        const response = await this.productService.searchProduct(_request);
        this.products = response;
        if (this.products.length > 0) {
          this.getProductsForm.get('barcode').setValue(null);
          // this.products = []; adil açtırdı
          await this.addCurrentProducts(this.products[0]);
        } else {
          this.toasterService.error("Ürün Bulunamadı")
        }
        return response;
      } catch (error: any) {
        console.log(error.message);
        return null;
      }
    } else {
      if (!request.shelfNo) {
        this.generalService.focusNextInput('shelfNo')
        return;
      }
      var check_response = await this.warehouseService.countProductRequest(
        request.barcode,
        request.shelfNo,
        1
        ,
        '',
        '',
        '',
        'Order/CountProductControl',
        this.orderNo,
        ''
      );
      //↑↑↑↑↑↑↑↑↑ BARKOD KONTROL EDİLDİ ↑↑↑↑↑↑↑↑↑

      if (check_response != undefined) {
        var data: ProductCountModel = check_response;

        if (data.status != 'RAF') {
          this.getProductsForm.get('barcode').setValue(check_response.description);
        }


        const response = await this.productService.searchProduct3(check_response.description, check_response.batchCode, this.getProductsForm.value.shelfNo);
        this.products = response;
        if (this.products.length > 0) {
          var totalQty = 0;
          this.products.forEach(p => {
            totalQty += p.quantity
          });
          if (totalQty <= 0) {
            this.toasterService.error("STOK HATASI")
            return;
          }
          if (this.products[0].shelfNo != this.getProductsForm.get('shelfNo').value) {
            this.products[0].shelfNo = this.getProductsForm.get('shelfNo').value
            this.toasterService.info("RAF NUMARASI EŞLEŞTRİLDİ")
          }
          this.getProductsForm.get('barcode').setValue(null);
          this.getProductsForm.get('shelfNo').setValue(null);

          await this.addCurrentProducts(this.products[0]);
          this.products = [];
        }
        return response;

      }
    }

  }


  async addCurrentProducts(request: ProductList_VM) {

    if (request.quantity > 0) {
      var order_request = this.createClientOrder_RM()
      var order_response = await this.orderService.createClientOrder(order_request) //sipariş oluşturuldu varsa güncellendi
      if (order_response) {


        var line_request = this.createClientOrderBasketItem_RM(request);
        if (line_request.itemCode.startsWith('FG')) {
          line_request.quantity = 5;
        }
        var line_response = await this.orderService.createClientOrderBasketItem(line_request); //sipariş ürünü oluşturuldu
        if (line_response) {
          this.toasterService.success("Ürün Eklendi")
          this.generalService.beep()
          await this.getClientOrder(1); //sipariş ürünleri çekildi

        }
      }
    } else {
      this.toasterService.error('Stok Hatası');
    }



  }
  async deleteProduct(product: ProductList_VM) {
    const isConfirmed = window.confirm("Ürünü silmek istediğinize emin misiniz?");

    if (isConfirmed) {
      var response = await this.orderService.deleteClientOrderBasketItem(this.id, product.lineId);
      if (response) {
        this.toasterService.success("Ürün Silindi")
        await this.getClientOrder(1);
      }
    } else {
      // Kullanıcı silmeyi iptal ettiğinde yapılacak işlemler buraya yazılabilir.
      console.log("Ürün silme işlemi iptal edildi.");
    }
  }

  clonedProducts: { [s: string]: ProductList_VM } = {};
  onRowEditInit(product: ProductList_VM) {
    this.clonedProducts[product.lineId as string] = { ...product };
  }


  async updateQuantity(qty: number, product: ProductList_VM) {
    if (product.itemCode.startsWith('FG')) {
      qty = qty * 5
    }
    product.quantity += qty
    var response = await this.orderService.updateClientOrderBasketItem(this.id, product.lineId, product.quantity, product.price, product.discountedPrice, product.basePrice)
    if (response) {
      this.toasterService.success("Ürün Güncellendi")
      this.getClientOrder(1);
    }
  }

  @ViewChild('dt1') myTable: Table;
  async onRowEditSave(product: ProductList_VM, index: number) {
    if (product.price > 0) {
      // this.toasterService.success(product.quantity.toString());
      var response = await this.orderService.updateClientOrderBasketItem(this.id, product.lineId, product.quantity, product.price, product.discountedPrice, product.basePrice)
      if (response) {
        this.toasterService.success("Ürün Güncellendi")
        this.getClientOrder(1);
      }
      delete this.clonedProducts[product.lineId as string];

    } else {

    }
    this.cancelRowEdit(product, 0);
  }


  cancelRowEdit(product: ProductList_VM, index: number) {

    this.selectedProducts.forEach(product => {
      this.myTable.cancelRowEdit(product);

    });


  }
  onRowEditCancel(product: ProductList_VM, index: number) {
    this.products[index] = this.clonedProducts[product.lineId as string];
    delete this.clonedProducts[product.lineId as string];
  }


  //----------------------------------------------------
  //---------------------------------------------------- KARGO
  cargoForm: FormGroup

  cargoPrices: any[] = [{ name: 'DOSYA (₺90)', code: 90 }, { name: 'PAKET (₺80) ', code: 80 }, { name: 'K.KOLİ (₺115)', code: 115 }
    , { name: 'O.KOLİ (₺140)', code: 140 },
  { name: 'B.KOLİ (₺180)', code: 180 }]



  packagingTypes: any[] = [{ name: 'DOSYA', code: '1' }, { name: 'PAKET', code: '3' }, { name: 'KOLİ', code: '4' }]
  shipmentServiceTypes: any[] = [{ name: 'GÖNDERİCİ ÖDEMELİ', code: '1' }, { name: 'ALICI ÖDEMELİ', code: '2' }]
  cargoFirms: any[] = [{ name: 'Mng', code: 1 }, { name: 'Aras', code: 2 }]

  orderDetail: OrderDetail;

  arasCargoBarcode: string = null;
  getBase64(base64: string) {
    this.arasCargoBarcode = base64;
    this.toasterService.success("Barkod Oluşturuldu")
    this.goToPage(2);
  }
  async getOrderDetail() {
    this.orderDetail = await this.orderService.getOrderDetail(this.orderNumber);

    if (this.orderDetail) {
      var request: GetCustomerAddress_CM = new GetCustomerAddress_CM();
      request.currAccCode = this.orderDetail.currAccCode;
      this.getCustomerAddresses(request);
    }


  }
  generatedCargoNumber: number = 0;
  _generateRandomNumber(): number {
    // 335 ile başlayan bir sayı üretir ve geri kalan 7 hanesini rastgele doldurur
    const prefix = 335; // Sabit başlangıç
    const min = Math.pow(10, 6); // Rastgele sayının minimum değeri (1 ile başlaması için)
    const max = Math.pow(10, 7) - 1; // Rastgele sayının maksimum değeri
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min; // 7 haneli rastgele sayı

    return Number(`${prefix}${randomNumber}`);
  }

  async createCargoForm() {
    this.cargoForm = this.formBuilder.group({
      address_phoneNumber: [null],
      packagingType: [null], //select
      shipmentServiceType: [null], //select
      isCOD: [false],
      kg: [1],
      desi: [1],
      address_recepient_name: [null],
      isActive: [false],
      cargoFirm: [null],
      address_package_count: [1, Validators.min(1)],
      cargoPrice: [null]
    })
    this.cargoForm.get('cargoFirm').valueChanges.subscribe((value) => {
      if (value != null) {
        this.cargoForm.get('isActive').setValue(true);
      }

    })
    this.cargoForm.get('isActive').valueChanges.subscribe((value) => {
      if (value === false) {
        this.cargoForm.get('packagingType').clearValidators();
        this.cargoForm.get('packagingType').updateValueAndValidity();
        this.cargoForm.get('shipmentServiceType').clearValidators();
        this.cargoForm.get('shipmentServiceType').updateValueAndValidity();
        this.cargoForm.get('address_recepient_name').clearValidators();
        this.cargoForm.get('address_recepient_name').updateValueAndValidity();
        this.cargoForm.get('isCOD').clearValidators();
        this.cargoForm.get('address_phoneNumber').clearValidators();
        this.cargoForm.get('cargoPrice').clearValidators();

        this.cargoForm.get('kg').clearValidators();
        this.cargoForm.get('desi').clearValidators();

      } else {
        this.cargoForm.get('packagingType').setValidators(Validators.required);
        this.cargoForm.get('packagingType').updateValueAndValidity();
        this.cargoForm.get('shipmentServiceType').setValidators(Validators.required);
        this.cargoForm.get('shipmentServiceType').updateValueAndValidity();
        this.cargoForm.get('address_recepient_name').setValidators(Validators.required);
        this.cargoForm.get('address_recepient_name').updateValueAndValidity();
        this.cargoForm.get('isCOD').setValidators(Validators.required);
        this.cargoForm.get('address_phoneNumber').setValidators(Validators.required);
        this.cargoForm.get('cargoPrice').setValidators(Validators.required);

        this.cargoForm.get('kg').setValidators(Validators.required);
        this.cargoForm.get('desi').setValidators(Validators.required);

      }


    });
    this.cargoForm.get('cargoPrice').valueChanges.subscribe(async (value) => {
      if (this.cargoForm.get('packagingType').value.code === '1') {

      }
      var _product: ProductList_VM = this.selectedProducts.find(p => p.itemCode == 'KARGO');
      {
        if (!_product) {

          if (this.orderType) {
            this.getProductsForm.get('barcode').setValue('KARGO');
            await this.getProducts(this.getProductsForm.value, this.orderType);

          } else {
            this.getProductsForm.get('barcode').setValue('KARGO');
            this.getProductsForm.get('shelfNo').setValue('KARGO04');

            await this.getProducts(this.getProductsForm.value, this.orderType);

          }

          var __product: ProductList_VM = this.selectedProducts.find(p => p.itemCode == 'KARGO');

          __product.price = value.code;

          __product.basePrice = value.code;
          __product.discountedPrice = value.code;
          await this.orderService.updateClientOrderBasketItem(this.id, __product.lineId, __product.quantity, __product.price, __product.discountedPrice, __product.discountedPrice);

        } else {
          _product.price = value.code;
          _product.basePrice = value.code;

          _product.discountedPrice = value.code;
          await this.orderService.updateClientOrderBasketItem(this.id, _product.lineId, _product.quantity, _product.price, _product.discountedPrice, _product.basePrice);
        }

      }


    })
    this.cargoForm.get('packagingType').valueChanges.subscribe((value) => {
      if (value.code === '3') {
        this.cargoForm.get('kg').setValue(2)
        this.cargoForm.get('desi').setValue(2)
        this.cargoForm.get('kg').setValidators([Validators.required, Validators.min(2)]);
        this.cargoForm.get('desi').setValidators([Validators.required, Validators.min(2)]);
      } else if (value.code === '4') {
        this.cargoForm.get('kg').setValue(1)
        this.cargoForm.get('desi').setValue(1)
        this.cargoForm.get('kg').setValidators([Validators.required, Validators.min(1)]);
        this.cargoForm.get('desi').setValidators([Validators.required, Validators.min(1)]);
      } else {
        this.cargoForm.get('kg').setValue(0)
        this.cargoForm.get('desi').setValue(0)
        this.cargoForm.get('kg').setValidators([Validators.required, Validators.min(0)]);
        this.cargoForm.get('desi').setValidators([Validators.required, Validators.min(0)]);
      }
      this.cargoForm.get('kg').updateValueAndValidity();
      this.cargoForm.get('desi').updateValueAndValidity();
    });

    this.cargoForm.get('kg').valueChanges.subscribe((value) => {
      if (this.cargoForm.get('packagingType').value.code === '3') { //paket
        if (value < 2) {
          this.kgErrorMessage = 'Paket gönderimlerinde KG değeri 2 den büyük olmalıdır'
        } else {
          this.kgErrorMessage = ''
        }
      } else if (this.cargoForm.get('packagingType').value.code === '4') { //koli
        if (value < 1) {
          this.kgErrorMessage = 'Koli gönderimlerinde KG değeri 1 den büyük olmalıdır'
        } else {
          this.kgErrorMessage = ''
        }
      }
    });
    this.cargoForm.get('desi').valueChanges.subscribe((value) => {
      if (this.cargoForm.get('packagingType').value.code === '3') {
        if (value < 2) {
          this.desiErrorMessage = 'Paket gönderimlerinde DESİ değeri 2 den büyük olmalıdır'
        } else {
          this.desiErrorMessage = ''
        }
      } else if (this.cargoForm.get('packagingType').value.code === '4') {
        if (value < 1) {
          this.desiErrorMessage = 'Koli gönderimlerinde DESİ değeri 1 den büyük olmalıdır'
        } else {
          this.desiErrorMessage = ''
        }
      }
    });


  }
  desiErrorMessage = '';
  kgErrorMessage = '';
  cargoResponse: CreatePackage_MNG_RR;

  async submitCargo(formValue: any) {
    await this.getOrderDetail();
    var cargoFirmId: number = this.cargoForm.get('cargoFirm').value.code;
    if (this.orderDetail) {
      //console.log(this.cargoForm.value);

      var recepient_name = formValue.address_recepient_name;
      var phoneNumber = formValue.address_phoneNumber;

      if (recepient_name != null && recepient_name != '') {
        this.orderDetail.customer = recepient_name;
        this.toasterService.info('Alıcı Adı Değişikliği Algılandı')
      }
      if (phoneNumber != null && phoneNumber != '') {
        this.orderDetail.phone = phoneNumber;
        this.toasterService.info('Telefon Değişikliği Algılandı')
      }

      if (this.selectedAddresses.length > 0) {
        this.orderDetail.address = this.selectedAddresses[0].address;
        this.orderDetail.city = this.selectedAddresses[0].cityDescription;
        this.orderDetail.district = this.selectedAddresses[0].districtDescription;
      }

      var content = this.selectedProducts.length.toString() + "Adet Ürün";
      var cargoSetting: CargoSetting = new CargoSetting(formValue.isCOD === false ? 0 : 1, Number(formValue.packagingType.code), Number(formValue.shipmentServiceType.code), content,
        this.orderDetail);
      var referenceId = this.generatedCargoNumber;
      var orderRequest: CreatePackage_MNG_Request = new CreatePackage_MNG_Request(referenceId.toString(), this.orderDetail, cargoSetting)

      //---barcode requesst
      var barcodeRequest: CreateBarcode_MNG_Request = new CreateBarcode_MNG_Request();
      barcodeRequest.referenceId = orderRequest.order.referenceId;
      barcodeRequest.billOfLandingId = orderRequest.order.billOfLandingId;
      barcodeRequest.isCOD = orderRequest.order.isCod;
      barcodeRequest.codAmount = orderRequest.order.codAmount;
      barcodeRequest.packagingType = orderRequest.order.packagingType;

      var totalProductQuantity = this.selectedProducts.reduce((total, product) => total + product.quantity, 0);
      var content = totalProductQuantity.toString() + " Adet Ürün";
      var orderPieces: OrderPieceListMNG[] = []


      if (formValue.address_package_count > 1) {

        for (let index = 1; index <= formValue.address_package_count; index++) {
          var orderPiece: OrderPieceListMNG = new OrderPieceListMNG();
          orderPiece.barcode = orderRequest.order.barcode + "0" + index.toString();
          orderPiece.content = (totalProductQuantity / formValue.address_package_count).toString() + " Adet Ürün";
          orderPiece.desi = orderRequest.order.packagingType === 1 ? 1 : orderRequest.order.packagingType === 3 ? 2 : this.cargoForm.get('desi').value
          orderPiece.kg = orderRequest.order.packagingType === 1 ? 1 : orderRequest.order.packagingType === 3 ? 2 : this.cargoForm.get('kg').value
          orderPieces.push(orderPiece);
        }
        barcodeRequest.orderPieceList = orderPieces;
      } else if (formValue.address_package_count === 1) {
        var _orderPiece: OrderPieceListMNG = new OrderPieceListMNG();
        _orderPiece.barcode = orderRequest.order.barcode;
        _orderPiece.content = content
        _orderPiece.desi = orderRequest.order.packagingType === 1 ? 1 : orderRequest.order.packagingType === 3 ? 2 : this.cargoForm.get('desi').value
        _orderPiece.kg = orderRequest.order.packagingType === 1 ? 1 : orderRequest.order.packagingType === 3 ? 2 : this.cargoForm.get('kg').value
        orderPieces.push(_orderPiece);

      } else {
        this.toasterService.error("Paket Adedi 1 den küçük olamaz");
        return;
      }



      //---

      var _request: CreatePackage_MNG_RM = new CreatePackage_MNG_RM();
      _request.orderRequest = orderRequest;
      _request.barcodeRequest = barcodeRequest;
      if (cargoFirmId === 2) {
        _request.barcodeBase64 = this.arasCargoBarcode;
        _request.cargoFirmId = 2;
      } else {
        _request.barcodeBase64 = null;
        _request.cargoFirmId = 1;
      }

      var response = await this.cargoService.createCargo(_request, cargoFirmId);
      if (response) {
        this.cargoResponse = response;
        this.toasterService.success("Kargo Siparişi Oluturuldu (BARKOD BASILABİLİR)");
      }
      //console.log(response);
    }

  }

  async CreateBarcode_RM(): Promise<CreateBarcode_MNG_Request> {
    if (this.cargoResponse) {
      var request: CreateBarcode_MNG_Request = new CreateBarcode_MNG_Request();
      request.referenceId = this.cargoResponse.request.order.referenceId;
      request.billOfLandingId = this.cargoResponse.request.order.billOfLandingId;
      request.isCOD = this.cargoResponse.request.order.isCod;
      request.codAmount = this.cargoResponse.request.order.codAmount;
      request.packagingType = this.cargoResponse.request.order.packagingType;
      request.response = this.cargoResponse;
      var content = this.cargoResponse.request.orderPieceList.length.toString() + " Adet Ürün";
      var orderPieces: OrderPieceListMNG[] = []
      var orderPiece: OrderPieceListMNG = new OrderPieceListMNG();
      orderPiece.barcode = this.cargoResponse.request.order.barcode;
      orderPiece.content = content
      orderPiece.desi = this.cargoResponse.request.order.packagingType === 1 ? 0 : this.cargoForm.get('desi').value
      orderPiece.kg = this.cargoResponse.request.order.packagingType === 1 ? 0 : this.cargoForm.get('kg').value
      orderPieces.push(orderPiece);


      request.orderPieceList = orderPieces;
      return request;

    } else {
      return null;
    }
  }

  //----------------------------------------------------

  //---------------------------------------------------- SİPARİŞ

  sidebarVisible4 = true;


  async createNewOrder() {

    var response = window.confirm("Yeni Sipariş Oluşturulacak. Devam Etmek İstiyor musunuz?");
    if (response) {
      var orderNo = await this.generalService.generateGUID();
      if (this.orderType) {
        var Url = location.origin + "/create-order/quick-order/" + orderNo;
        location.href = Url
      } else {
        var Url = location.origin + "/create-order/retail-order/" + orderNo;
        location.href = Url
      }
    }



  }
  generateRandomNumber(): string {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return "MSG-" + result;
  }
  async createPayment(state: number) {
    this.activeIndex = 6;
    var payment: Payment = new Payment();

    // return null;
    if (state === 1) {
      //PAYTR İŞLEMLERİ
      var response = await this.orderService.updateClientOrderPayment(this.id, "PAYTR IFRAME")
      if (response) {
        await this.getPaymentPage();
        payment.currencyCode = "TRY";
        payment.code = "";
        payment.installmentCount = 0;
        payment.paymentType = "2";
        payment.creditCardTypeCode = "PAYTR IFRAME"
        payment.amount = this.selectedProducts.reduce((total, product) => total + product.price, 0);
        this.payment = payment;
      }

    } else if (state === 2) {
      //NAKİT İŞLEMLERİ
      var response = await this.orderService.updateClientOrderPayment(this.id, "NAKİT")
      if (response) {

        payment.currencyCode = "TRY";
        payment.code = "";
        payment.installmentCount = 0;
        payment.paymentType = "2";
        payment.creditCardTypeCode = "NAKİT"
        payment.amount = this.selectedProducts.reduce((total, product) => total + product.price, 0);
        this.payment = payment;
      }
      return null;
    }
    else if (state === 3) {
      //HAVALE İŞLEMLERİ
      var response = await this.orderService.updateClientOrderPayment(this.id, "HAVALE")
      if (response) {

        payment.currencyCode = "TRY";
        payment.code = "";
        payment.installmentCount = 0;
        payment.paymentType = "2";
        payment.creditCardTypeCode = "HAVALE"
        payment.amount = this.selectedProducts.reduce((total, product) => total + product.price, 0);
        this.payment = payment;
      }
      return null;
    }
    else if (state === 4) {
      //HAVALE İŞLEMLERİ
      var response = await this.orderService.updateClientOrderPayment(this.id, "VADE")
      if (response) {

        payment.currencyCode = "TRY";
        payment.code = "";
        payment.installmentCount = 0;
        payment.paymentType = "2";
        payment.creditCardTypeCode = "VADE"
        payment.amount = this.selectedProducts.reduce((total, product) => total + product.price, 0);
        this.payment = payment;
      }
      return null;
    }
    else if (state === 5) {
      //HAVALE İŞLEMLERİ
      var response = await this.orderService.updateClientOrderPayment(this.id, "POS")
      if (response) {

        payment.currencyCode = "TRY";
        payment.code = "";
        payment.installmentCount = 0;
        payment.paymentType = "2";
        payment.creditCardTypeCode = "POS"
        payment.amount = this.selectedProducts.reduce((total, product) => total + product.price, 0);
        this.payment = payment;
      }
      return null;
    }
    else if (state === 6) {
      //HAVALE İŞLEMLERİ
      var response = await this.orderService.updateClientOrderPayment(this.id, "PAYTRSMS")
      if (response) {
        await this.sendPaymentPage();
        payment.currencyCode = "TRY";
        payment.code = "";
        payment.installmentCount = 0;
        payment.paymentType = "2";
        payment.creditCardTypeCode = "PAYTRSMS"
        payment.amount = this.selectedProducts.reduce((total, product) => total + product.price, 0);
        this.payment = payment;
      }
      return null;
    }
    this.payment = payment;
    this.generalService.beep();

    this.toasterService.success("Ödeme Onaylandı")
  }

  calculateDiscountPercent(products: ProductList_VM[]): number {
    var totalPrice = 0;
    var discountedTotalPrice = 0;
    products.forEach(p => {
      totalPrice += p.basePrice * p.quantity;
      discountedTotalPrice += p.discountedPrice * p.quantity;
    });
    var totalDiscount = ((totalPrice - discountedTotalPrice) / totalPrice) * 100;
    return parseFloat(totalDiscount.toFixed(2));
  }
  async createOrder() {
    if (!this.cargoForm.valid) {
      this.toasterService.error("Kargo Formu Hatalı");
      return;
    }

    if (!this.payment.creditCardTypeCode) {
      this.toasterService.error("Ödeme Tipi Seçiniz");
      return;
    }

    if (!this.taxTypeCode) {
      this.toasterService.error("Vergi Tipi Seçiniz");
      return;
    }

    var formValue = this.createCustomerForm.value;

    if (!this.currAccCode) {
      this.toasterService.error("Müşteri Seçiniz");
      return;
    }

    if (!this.salesPersonCode) {
      this.toasterService.error("Satış Elemanı Seçiniz");
      return;
    }

    if (this.selectedProducts.length <= 0) {
      this.toasterService.error("Ürün Ekleyiniz");
      return;
    }
    var exchangeRate: number = 0;
    if (this.selectedCustomers[0].docCurrencyCode === 'TRY') {
      exchangeRate = 1;
    } else if (this.selectedCustomers[0].docCurrencyCode === 'USD') {
      exchangeRate = this.exchangeRate.usd
    }
    else if (this.selectedCustomers[0].docCurrencyCode === 'EUR') {
      exchangeRate = this.exchangeRate.eur
    }
    if (exchangeRate === 0) {
      this.toasterService.error("EXCHANGE RATE ERROR")
      return
    }


    var discountPercent: number = this.calculateDiscountPercent(this.selectedProducts);
    if (this.orderType) {
      var request: NebimOrder = new NebimOrder(
        exchangeRate,
        discountPercent,
        this.cargoForm.get("address_recepient_name").value,
        this.currAccCode,
        this.orderNo,
        formValue,
        this.selectedProducts,
        this.salesPersonCode,
        this.taxTypeCode
      );

      var response = await this.orderService.createOrder(request);
      if (response && response.status === true) {
        this.orderNumber = response.orderNumber;

        if (this.cargoForm.get('isActive').value === true) {
          await this.submitCargo(this.cargoForm.value);
        } else {
          this.toasterService.info('KARGO OLUŞTURULMADI');
        }

        this.generalService.waitAndNavigate("Sipariş Oluşturuldu", "orders-managament");
      }
    } else {
      var _request: NebimOrder = new NebimOrder(
        exchangeRate,
        discountPercent,
        this.cargoForm.get("address_recepient_name").value,
        this.currAccCode,
        this.orderNo,
        formValue,
        this.selectedProducts,
        this.salesPersonCode,
        this.taxTypeCode
      );

      var response = await this.orderService.createOrder(_request);
      if (response && response.status === true) {
        this.orderNumber = response.orderNumber;

        if (this.cargoForm.get('isActive').value === true) {
          await this.submitCargo(this.cargoForm.value);
        } else {
          this.toasterService.info('KARGO OLUŞTURULMADI');
        }
      }


      var __request: NebimInvoice = new NebimInvoice(
        discountPercent,
        exchangeRate,
        this.selectedCustomers[0].docCurrencyCode,
        this.cargoForm.get("address_recepient_name").value,
        this.currAccCode,
        this.orderNo,
        formValue,
        this.selectedProducts,
        this.salesPersonCode,
        this.taxTypeCode,
        this.selectedAddresses[0].postalAddressID
      );

      __request.lines.forEach(l1 => {
        var fp = response.lines.find((p: { itemCode: string; usedBarcode: string; qty1: number; }) =>
          p.itemCode === l1.itemCode && p.usedBarcode === l1.usedBarcode && p.qty1 === l1.qty1
        );

        if (fp) {
          l1.currencyCode = this.selectedCustomers[0].docCurrencyCode;
          l1.orderLineId = fp.orderLineId;

        }
      });

      var __response = await this.orderService.createInvoice(__request);
      if (__response) {
        this.generalService.waitAndNavigate("Sipariş Oluşturuldu & Faturalaştırıdı", "orders-managament");
      }
    }
  }

  //----------------------------------------------------

  //---------------------------------------------------- PAYMENTS

  paymentMethods = [
    { id: 1, name: 'PayTr IFRAME', icon: 'fas fa-globe' },
    { id: 6, name: 'PayTr SMS/MAIL', icon: 'fas fa-envelope' },
    { id: 5, name: 'POS İle Öde', icon: 'fas fa-credit-card' },
    { id: 3, name: 'Havale İle Öde', icon: 'fas fa-university' },
    { id: 2, name: 'Nakit İle Öde', icon: 'fas fa-wallet' },
    { id: 4, name: 'Cari Ödeme', icon: 'fas fa-file-invoice-dollar' }
  ];


  async getPaymentCommandModel(): Promise<Payment_CM> {

    var model: Payment_CM = new Payment_CM();
    let totalPrice = 0;
    for (const product of this.selectedProducts) {
      totalPrice += product.price * product.quantity;
    }

    if (this.orderNo) {
      model.orderNo = this.orderNo;
      model.basketItems = this.selectedProducts;
      model.totalValue = totalPrice.toString();

      model.user = this.selectedCustomers[0];
      model.address = this.selectedAddresses[0];

      return model;
    }

    else {
      return null;
    }
  }



  async getPaymentPage() {

    var request: Payment_CM = await this.getPaymentCommandModel();
    var response: Payment_CR = await this.paymentService.getPaymentPage(request)
    window.open(response.pageUrl);

  }

  async sendPaymentPage() {

    var request: Payment_CM = await this.getPaymentCommandModel();
    var response: Payment_CR = await this.paymentService.sendPaymentPage(request)
    window.open(response.pageUrl);

  }


  //----------------------------------------------------
}
