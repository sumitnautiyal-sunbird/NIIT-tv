import { Subscription, Observable } from 'rxjs';
import {
  ConfigService, ResourceService, Framework, ToasterService, ServerResponse,
  BrowserCacheTtlService, IUserData
} from '@sunbird/shared';
import { Component, OnInit, Input, Output, EventEmitter, ApplicationRef, ChangeDetectorRef,
  OnDestroy, OnChanges, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FrameworkService, FormService, ConceptPickerService, PermissionService, UserService } from '../../../../../core/services';
import * as _ from 'lodash';
import { CacheService } from 'ng2-cache-service';
import { IInteractEventEdata } from '@sunbird/telemetry';
import { CookieManagerService } from '../../../../../shared/services/cookie-manager/cookie-manager.service';

export class Filter {
  code: string;
  name: string;
}
@Component({
  selector: 'app-catalog-filters',
  templateUrl: './catalog-filters.component.html',
  styleUrls: ['./catalog-filters.component.css']
})
export class CatalogFiltersComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() filterEnv: string;
  @Input() accordionDefaultOpen: boolean;
  @Input() isShowFilterLabel: boolean;
  @Input() hashTagId = '';
  @Input() ignoreQuery = [];
  @Input() showSearchedParam = true;
  @Input() enrichFilters: object;
  @Input() pageId: string;
  @Output() filters = new EventEmitter();
  @Output() dataDrivenFilter = new EventEmitter();
  public expand = false;

  /**
 * To get url, app configs
 */
  public configService: ConfigService;

  public resourceService: ResourceService;
 langselected : any;
 translationsobj : any;
 parseObj:any;
  public filterType: string;
  /**
 * To navigate to other pages
 */
  public router: Router;
  /**
* To show toaster(error, success etc) after any API calls
*/
  public toasterService: ToasterService;

  public frameworkService: FrameworkService;

  public formService: FormService;

  public formFieldProperties: any;
  public filtersDetails: any;

  public categoryMasterList: any;

  public framework: string;

  public isCachedDataExists: boolean;

  public formType = 'content';

  public formAction = 'search';

  public queryParams: any;
  checkCategory = 'undefined';
  /**
 * formInputData is to take input data's from form
 */
  public formInputData: any;
  @Input() viewAllMode = false;


  userRoles = [];
  selectedFilter: Filter;
  public permissionService: PermissionService;
  public userService: UserService;
  public loggedInUserRoles = [];

  selectedConcepts: Array<object>;
  showConcepts = false;
  refresh = true;
  isShowFilterPlaceholder = true;
  contentTypes: any;
  frameworkDataSubscription: Subscription;
  filterIntractEdata: IInteractEventEdata;
  submitIntractEdata: IInteractEventEdata;
  browsingCategory: any;
  tempKey: any;
  public filterSelected = false;
  flagArray = [];
  public tenantData: any;
  public frameworkName = null;
  /**
    * Constructor to create injected service(s) object
    Default method of Draft Component class
    * @param {Router} route Reference of Router
    * @param {PaginationService} paginationService Reference of PaginationService
    * @param {ConfigService} config Reference of ConfigService
  */
  constructor(configService: ConfigService,
    resourceService: ResourceService,
    router: Router,
    private activatedRoute: ActivatedRoute,
    private _cacheService: CacheService,
    private cdr: ChangeDetectorRef,
    frameworkService: FrameworkService,
    formService: FormService,
    toasterService: ToasterService,
    userService: UserService,
    public conceptPickerService: ConceptPickerService,
    permissionService: PermissionService,
    private browserCacheTtlService: BrowserCacheTtlService,
    private cookieSrvc: CookieManagerService

  ) {
    this.userService = userService;
    this.configService = configService;
    this.resourceService = resourceService;
    this.router = router;
    this.frameworkService = frameworkService;
    this.formService = formService;
    this.toasterService = toasterService;
    this.permissionService = permissionService;
    this.formInputData = {};
    this.router.onSameUrlNavigation = 'reload';
    this.resourceService.languageSelected$.subscribe(item => {
      if (item.value) {
        this.langselected = item.value;
      }
      else {
        this.langselected = item;
      }
      console.log("language selected in browse courses", this.langselected);

    });
  }

  ngOnInit() {
    this.tenantData = this.cookieSrvc.getCookie('theming') || null;
    if (!!this.tenantData && this.tenantData.length > 0) {
      this.tenantData = JSON.parse(this.tenantData);
      this.frameworkName = this.tenantData['framework'];
    }
    this.hashTagId = !!this.tenantData['orgid'] ? this.tenantData['orgid'] : this.activatedRoute.snapshot.data.orgdata.rootOrgId;
    this.framework = !!this.frameworkName ? this.frameworkName : this.activatedRoute.snapshot.data.orgdata.defaultFramework;
    this.frameworkService.initialize(this.hashTagId);
    this.formInputData = {};
    this.activatedRoute.paramMap.subscribe((paramMap: any) => {
      if (paramMap.params.cat) {
        this.browsingCategory = paramMap.params.cat;
      }
    });
    this.activatedRoute.queryParams.subscribe((params) => {
      this.queryParams = { ...params };
      _.forIn(params, (value, key) => {
        if (typeof value === 'string' && key !== 'key' && key !== 'language') {
          this.queryParams[key] = [value];
        }
      });
      this.formInputData = _.pickBy(this.queryParams);
    });
    this.getQueryParams();
    this.fetchFilterMetaData();

    this.contentTypes = this.configService.dropDownConfig.FILTER.RESOURCES.contentTypes;
    this.userService.userData$.subscribe(
      (user: IUserData) => {
        if (user && !user.err) {
          this.loggedInUserRoles = user.userProfile.userRoles;
        }
      });
    this.filterIntractEdata = {
      id: 'filter',
      type: 'click',
      pageid: this.pageId
    };
    this.submitIntractEdata = {
      id: 'submit',
      type: 'click',
      pageid: this.pageId,
      extra: { filter: this.formInputData }
    };
  }

  getQueryParams() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.queryParams = { ...params };
      _.forIn(params, (value, key) => {
        if (typeof value === 'string' && key !== 'key' && key !== 'language') {
          this.queryParams[key] = [value];
        }
      });
      this.formInputData = _.pickBy(this.queryParams);
      this.onFilterChange1(this.formInputData);
      this.refresh = false;
      this.cdr.detectChanges();
      this.refresh = true;
      this.conceptPickerService.conceptData$.subscribe(conceptData => {
        if (conceptData && !conceptData.err) {
          this.selectedConcepts = conceptData.data;
          if (this.formInputData && this.formInputData.concepts) {
            this.formInputData.concepts = this.conceptPickerService.processConcepts(this.formInputData.concepts, this.selectedConcepts);
          }
          this.showConcepts = true;
        }
      });

    });
  }
  /**
* fetchFilterMetaData is gives form config data
*/
  fetchFilterMetaData() {
    this.isCachedDataExists = this._cacheService.exists(this.filterEnv + this.formAction);
    // if (!this.isCachedDataExists) {
    //   const data: any | null = this._cacheService.get(this.filterEnv + this.formAction);
    //   this.formFieldProperties = data;
    //   console.log('form field', data);
    //   this.dataDrivenFilter.emit(this.formFieldProperties);
    //   this.createFacets();
    // } else {
    this.frameworkDataSubscription = this.frameworkService.getFrameworkCategories(this.framework)
      .subscribe((frameworkData: any) => {
        if (frameworkData && !frameworkData.err) {
          this.categoryMasterList = _.cloneDeep(frameworkData.result.framework.categories);

          const formServiceInputParams = {
            formType: this.formType,
            formAction: this.formAction,
            contentType: this.filterEnv,
            framework: this.framework,
            component: 'portal'
          };
          this.formService.getFormConfig(formServiceInputParams, this.hashTagId).subscribe(
            (data: ServerResponse) => {
              this.formFieldProperties = data;
              //  this.translationsobj.push(JSON.parse(this.formFieldProperties.translations));
              // console.log("translation object",this.translationsobj);
              _.forEach(this.formFieldProperties, (formFieldCategory) => {
                if (formFieldCategory && formFieldCategory.allowedRoles) {
                  const userRoles = formFieldCategory.allowedRoles.filter(element => this.userRoles.includes(element));
                  if (!this.showField(formFieldCategory.allowedRoles)) {
                    this.formFieldProperties.splice(this.formFieldProperties.indexOf(formFieldCategory), 1);
                  }
                  if (formServiceInputParams.contentType === 'upforreview') {
                    this.updateFormFields(formFieldCategory);
                  }
                }
              });
              this.getFormConfig();
              this.dataDrivenFilter.emit(this.formFieldProperties);
            },
            (err: ServerResponse) => {
              this.dataDrivenFilter.emit([]);
              // this.toasterService.error(this.resourceService.messages.emsg.m0005);
            }
          );
        } else if (frameworkData && frameworkData.err) {
          this.dataDrivenFilter.emit([]);
          // this.toasterService.error(this.resourceService.messages.emsg.m0005);
        }
      });
  }
  // }
  onSelect(filter: Filter): void {
    this.selectedFilter = filter;
  }
  updateFormFields(formFieldCategory) {
    if (formFieldCategory && formFieldCategory.code === 'contentType') {
      if (_.indexOf(this.loggedInUserRoles, 'CONTENT_REVIEWER') !== -1 &&
        _.indexOf(this.loggedInUserRoles, 'BOOK_REVIEWER') !== -1) {
        const contentTypeIndex = _.findIndex(this.formFieldProperties, { code: 'contentType' });
        const rangeTextBookIndex = _.findIndex(this.formFieldProperties[contentTypeIndex].range, { name: 'TextBook' });
        if (rangeTextBookIndex === -1) {
          this.formFieldProperties[contentTypeIndex].range.push({ name: 'TextBook' });
        }
      }
    }
  }

  /**
 * @description - Which is used to config the form field vlaues
 * @param {formFieldProperties} formFieldProperties  - Field information
 */
  getFormConfig() {

    _.forEach(this.categoryMasterList, (category) => {
      _.forEach(this.formFieldProperties, (formFieldCategory) => {
        if (category.code === formFieldCategory.code && category.terms) {
          formFieldCategory.range = category.terms;
        }
        return formFieldCategory;
      });
    });
    this.formFieldProperties = _.sortBy(_.uniqBy(this.formFieldProperties, 'code'), 'index');
    this._cacheService.set(this.filterEnv + this.formAction, this.formFieldProperties,
      {
        maxAge: this.browserCacheTtlService.browserCacheTtl
      });
    this.createFacets();
  }
  createFacets() {
    this.translationsobj=[];
    this.filtersDetails = _.cloneDeep(this.formFieldProperties);
    
    const filterArray = [];
    _.forEach(this.filtersDetails, (value) => {
      if (value.translations) {
        this.parseObj = JSON.parse(value.translations);
        console.log("parsed data", this.parseObj);
        if (this.parseObj)
          this.translationsobj.push(this.parseObj);

      }
      filterArray.push(value.code);
      this.flagArray.push(false);

    });
    this.filters.emit(filterArray);
  }

  iconChange(i: number) {
    this.flagArray[i] = !this.flagArray[i];
  }

  public resetFilters() {
    const key1 = ['gradeLevel', 'board', 'medium', 'subject', 'rating'];
    _.forOwn(key1, (key) => {
      console.log(key);
      this.resetFilters2(key);
    });

    this.formInputData = _.pick(this.formInputData, this.ignoreQuery);
    if (this.viewAllMode) {
      const data = this._cacheService.get('viewAllQuery');
      _.forIn(data, (value, key) => this.formInputData[key] = value);
    }

    this.router.navigate([], { relativeTo: this.activatedRoute.parent, queryParams: this.formInputData });
    this.hardRefreshFilter();

  }

  private hardRefreshFilter() {
    this.refresh = false;
    this.cdr.detectChanges();
    this.refresh = true;

  }
  resetFilters2(name) {
console.log(name);
    const checkboxes: any = document.getElementsByName(name);
    for (let i = 0, n = checkboxes.length; i < n; i++) {
      checkboxes[i].checked = false;
    }
    if ((name in this.formInputData)) {
      delete this.formInputData[name];
    }

    this.applyFilters();
  }

  expandFilters() {
    this.expand = !this.expand;

  }
  /**
 * to get selected concepts from concept picker.
 */
  concepts(events) {
    this.formInputData['concepts'] = events;
  }
  /**
 * To check filterType.
 */
  isObject(val) { return typeof val === 'object'; }

  applyFilters() {
    this.queryParams = _.pickBy(this.formInputData, value => value.length > 0);
    let queryParams = {};
    _.forIn(this.queryParams, (value, key) => {
      if (key === 'concepts') {
        queryParams[key] = [];
        value.forEach((conceptDetails) => {
          queryParams[key].push(conceptDetails.identifier);
        });
      } else {
        queryParams[key] = value;
      }
    });
    queryParams = _.pickBy(queryParams, value => _.isArray(value) && value.length > 0);
    this.router.navigate([], { relativeTo: this.activatedRoute.parent, queryParams: queryParams });
  }

  removeFilterSelection(field, item) {
    const itemIndex = this.formInputData[field].indexOf(item);
    if (itemIndex !== -1) {
      this.formInputData[field].splice(itemIndex, 1);
      this.formInputData = _.pickBy(this.formInputData);
      this.refresh = false;
      this.cdr.detectChanges();
      this.refresh = true;
    }
  }

  showField(allowedRoles) {
    if (allowedRoles) {
      return this.permissionService.checkRolesPermissions(allowedRoles);
    } else {
      return true;
    }
  }
  ngOnChanges() {
    const enrichedArray = [];
    if (this.enrichFilters) {
      _.forIn(this.formFieldProperties, (value, key) => {
        if (this.enrichFilters[value.code]) {
          const enrichedObj = {};
          enrichedObj['code'] = value.code;
          enrichedObj['range'] = this.generateRange(this.enrichFilters[value.code]);
          enrichedObj['name'] = value.name;
          enrichedObj['inputType'] = value.inputType;
          enrichedObj['renderingHints'] = value.renderingHints;
          enrichedObj['renderingHints']['semanticColumnWidth'] = value.renderingHints.semanticColumnWidth;
          enrichedArray.push(enrichedObj);
        } else {
          const enrichedObj = {};
          enrichedObj['code'] = value.code;
          enrichedObj['range'] = [];
          enrichedObj['name'] = value.name;
          enrichedObj['inputType'] = value.inputType;
          enrichedObj['renderingHints'] = value.renderingHints;
          enrichedObj['renderingHints']['semanticColumnWidth'] = value.renderingHints.semanticColumnWidth;
          enrichedArray.push(enrichedObj);
        }
      });
    }
    this.filtersDetails = enrichedArray;
  }
  generateRange(enrichedRange) {
    const rangeArray = [];
    _.forEach(enrichedRange, (value) => {
      if (value && value.name !== '') {
        const rangeObj = _.find(enrichedRange, { name: value.name });
        rangeArray.push(rangeObj);
      }
    });
    return _.compact(rangeArray);
  }

  ngOnDestroy() {
    if (this.frameworkDataSubscription) {
      this.frameworkDataSubscription.unsubscribe();
    }
  }

  onFilterChange(event) {
    const { name, value } = event.target;
    if (event.target.checked) {
      if (!(name in this.formInputData)) {
        this.formInputData[name] = [];
      }
      if (!this.formInputData[name].includes(value)) {
        this.formInputData[name].push(value);
      }
    } else {
      const index = this.formInputData[name].indexOf(value);
      if (index > -1) {
        this.formInputData[name].splice(index, 1);
      }
    }
    this.applyFilters();
  }

  ngAfterViewInit() {
    this.onFilterChange1(this.formInputData);
  }

  onFilterChange1(event) {
    setTimeout(() => {
_.forOwn(event, (value, key) => {
    const checkboxes: any = document.getElementsByName(key);
    for (let i = 0, n = checkboxes.length; i < n; i++) {
      if (checkboxes[i].value === value[0]) {
        checkboxes[i].checked = true;
      } else if (value.length === 1) {
        checkboxes[i].checked = false;
      }
    }
    });
    }, 500);
  }
}
